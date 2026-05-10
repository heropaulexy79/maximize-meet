const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const dotenv = require("dotenv");
const { pipeline } = require("stream/promises");

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const s3Config = {
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
};

const bucketName = process.env.S3_BUCKET;
const s3Client = new S3Client(s3Config);

async function migrate() {
  console.log("🚀 Starting migration of existing recordings...");
  
  if (!bucketName) {
    console.error("❌ S3_BUCKET is not defined in .env.local");
    return;
  }

  try {
    // 1. List all .mp4 files in recordings/
    const listCmd = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "recordings/",
    });

    const response = await s3Client.send(listCmd);
    const files = response.Contents?.filter(f => f.Key.endsWith(".mp4")) || [];

    if (files.length === 0) {
      console.log("✅ No .mp4 files found in recordings/. Migration complete.");
      return;
    }

    console.log(`Found ${files.length} files to migrate.`);

    for (const file of files) {
      const key = file.Key;
      const baseName = path.basename(key, ".mp4");
      const audioKey = key.replace(".mp4", ".ogg");
      const tempDir = path.join(process.cwd(), "temp_migration");

      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

      const localVideoPath = path.join(tempDir, `${baseName}.mp4`);
      const localAudioPath = path.join(tempDir, `${baseName}.ogg`);

      console.log(`\n📦 Processing: ${key}`);

      // 2. Download
      console.log(`   ⬇️ Downloading...`);
      const getCmd = new GetObjectCommand({ Bucket: bucketName, Key: key });
      const { Body } = await s3Client.send(getCmd);
      await pipeline(Body, fs.createWriteStream(localVideoPath));

      // 3. Convert with FFmpeg
      console.log(`   🎙️ Extracting audio...`);
      await new Promise((resolve, reject) => {
        ffmpeg(localVideoPath)
          .noVideo()
          .audioCodec("libopus")
          .audioBitrate("64k")
          .format("ogg")
          .on("end", resolve)
          .on("error", reject)
          .save(localAudioPath);
      });

      // 4. Upload Audio
      console.log(`   ⬆️ Uploading audio...`);
      const audioData = fs.readFileSync(localAudioPath);
      const putCmd = new PutObjectCommand({
        Bucket: bucketName,
        Key: audioKey,
        Body: audioData,
        ContentType: "audio/ogg",
      });
      await s3Client.send(putCmd);

      // 5. Delete Original Video
      console.log(`   🗑️ Deleting original video...`);
      const delCmd = new DeleteObjectCommand({ Bucket: bucketName, Key: key });
      await s3Client.send(delCmd);

      // Cleanup local files
      fs.unlinkSync(localVideoPath);
      fs.unlinkSync(localAudioPath);

      console.log(`   ✨ Successfully migrated ${key} -> ${audioKey}`);
    }

    console.log("\n🎉 All recordings have been migrated to audio-only!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

migrate();
