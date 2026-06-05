import { groq, GROQ_MODELS } from "./groq";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import os from "os";
import { Readable } from "stream";
import ffmpeg from "fluent-ffmpeg";

let endpoint = process.env.S3_ENDPOINT || "";
const bucketName = process.env.S3_BUCKET || "";

if (bucketName && endpoint.endsWith(`/${bucketName}`)) {
  endpoint = endpoint.substring(0, endpoint.length - (bucketName.length + 1));
}

const s3Client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
});

/**
 * Transcribes audio using Groq's Whisper implementation.
 * Handles file retrieval from S3 and audio extraction if necessary.
 */
/**
 * Transcribes audio using Groq's Whisper implementation.
 * Handles file retrieval from S3, audio extraction, and chunking for large files.
 */
export async function transcribeAudio(fileUrl: string) {
  const tempDir = os.tmpdir();
  const fileKey = extractFileKey(fileUrl);
  const downloadPath = path.join(tempDir, `session_dl_${Date.now()}.mp4`);
  const audioPath = path.join(tempDir, `session_full_${Date.now()}.mp3`);

  try {
    console.log(`[AI] Downloading recording from S3: ${fileKey}`);
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: fileKey,
    });
    const response = await s3Client.send(command);
    
    if (!response.Body) throw new Error("Empty body from S3");

    // Save to temp file
    const fileStream = fs.createWriteStream(downloadPath);
    await new Promise<void>((resolve, reject) => {
      (response.Body as Readable).pipe(fileStream);
      fileStream.on("finish", () => resolve());
      fileStream.on("error", (err) => reject(err));
    });

    console.log(`[AI] Extracting audio for transcription...`);
    await new Promise<void>((resolve, reject) => {
      ffmpeg(downloadPath)
        .toFormat("mp3")
        .audioBitrate(64)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .save(audioPath);
    });

    const stats = fs.statSync(audioPath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    // Groq limit is 25MB. We use 20MB as a safety threshold.
    if (fileSizeInMB < 20) {
      console.log(`[AI] Size ${fileSizeInMB.toFixed(2)}MB is within limits. Direct transcription...`);
      return await groq.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: GROQ_MODELS.TRANSCRIPTION_V3_TURBO,
        response_format: "verbose_json",
      });
    }

    console.log(`[AI] Large file detected (${fileSizeInMB.toFixed(2)}MB). Splitting into chunks...`);
    const duration: number = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration || 0);
      });
    });

    const chunkMs = 10 * 60; // 10 minutes
    const overlapMs = 10; // 10 seconds
    const chunkPromises: Promise<any>[] = [];
    
    for (let start = 0; start < duration; start += (chunkMs - overlapMs)) {
      chunkPromises.push((async () => {
        const chunkPath = path.join(tempDir, `chunk_${start}_${Date.now()}.mp3`);
        const currentStart = start;
        console.log(`[AI] Processing chunk starting at ${currentStart}s...`);
        
        await new Promise<void>((resolve, reject) => {
          ffmpeg(audioPath)
            .setStartTime(currentStart)
            .setDuration(chunkMs)
            .on("end", () => resolve())
            .on("error", (err) => reject(err))
            .save(chunkPath);
        });

        try {
          const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(chunkPath),
            model: GROQ_MODELS.TRANSCRIPTION_V3_TURBO,
            response_format: "verbose_json",
          });
          return { transcription, offset: currentStart };
        } finally {
          if (fs.existsSync(chunkPath)) fs.unlinkSync(chunkPath);
        }
      })());
    }

    const results = await Promise.all(chunkPromises);
    // Sort results by offset to ensure correct order
    results.sort((a, b) => a.offset - b.offset);
    const subTranscripts = results.map(r => r.transcription);

    // Merge results
    console.log(`[AI] Merging ${subTranscripts.length} partial transcripts...`);
    const mergedText = subTranscripts.map(t => t.text).join(" ");
    const mergedSegments = results.flatMap((res, i) => {
      const offset = res.offset;
      return (res.transcription.segments || []).map((s: any) => ({
        ...s,
        start: s.start + offset,
        end: s.end + offset
      }));
    });

    return {
      text: mergedText,
      segments: mergedSegments,
      language: subTranscripts[0]?.language || "en"
    };

  } catch (error) {
    console.error("[AI] Transcription error:", error);
    throw error;
  } finally {
    // Cleanup
    if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  }
}

/**
 * Generates structured metadata (summary, insights, action items) from transcript.
 */
export async function analyzeSession(transcript: string) {
  try {
    console.log(`[AI] Analyzing session transcript...`);
    const prompt = `
      You are an elite leadership and mentorship assistant for the MAXIMIZE Academy.
      Analyze the following session transcript and generate a structured JSON response.

      RESPONSE FORMAT:
      {
        "title": "A compelling session title",
        "executiveSummary": "A high-level summary of the session",
        "keyThemes": ["theme1", "theme2"],
        "discussionPoints": ["point1", "point2"],
        "conclusions": "Main takeaways/conclusions",
        "leadershipPrinciples": ["principle1", "principle2"],
        "strategicInsights": ["insight1", "insight2"],
        "actionSteps": ["step1", "step2"],
        "reflectionQuestions": ["question1", "question2"],
        "tags": ["tag1", "tag2"],
        "relatedTopics": ["topic1", "topic2"]
      }

      TRANSCRIPT:
      ${transcript}
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: GROQ_MODELS.ANALYSIS,
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || "{}");
  } catch (error) {
    console.error("[AI] Analysis error:", error);
    throw error;
  }
}

function extractFileKey(url: string) {
  try {
    let key = url;

    if (!key) return "";

    // 1. Decode recursively up to 3 levels to handle nested or double-encoded URLs
    let lastKey = "";
    for (let i = 0; i < 3; i++) {
      if (!key.includes('%') || key === lastKey) break;
      try {
        lastKey = key;
        key = decodeURIComponent(key);
      } catch {
        break;
      }
    }

    // 2. Handle full https:// or http:// URLs
    if (key.startsWith("https://") || key.startsWith("http://")) {
      try {
        const urlObj = new URL(key);
        key = urlObj.pathname;
      } catch {
        const hostEnd = key.indexOf('/', 8);
        if (hostEnd !== -1) {
          key = key.substring(hostEnd + 1);
        }
      }
    } else if (key.startsWith("s3://")) {
      // 3. Handle s3:// protocol
      const withoutScheme = key.replace("s3://", "");
      const parts = withoutScheme.split("/");
      key = parts.length > 1 ? parts.slice(1).join("/") : parts[0];
    }

    // Normalization: Ensure no leading slashes
    while (key.startsWith("/")) {
      key = key.slice(1);
    }

    return key;
  } catch {
    return url;
  }
}
