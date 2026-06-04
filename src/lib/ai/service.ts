import { groq, GROQ_MODELS } from "./groq";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import os from "os";
import { Readable } from "stream";
import ffmpeg from "fluent-ffmpeg";

const s3Client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
});

/**
 * Transcribes audio using Groq's Whisper implementation.
 * Handles file retrieval from S3 and audio extraction if necessary.
 */
export async function transcribeAudio(fileUrl: string) {
  const tempDir = os.tmpdir();
  const fileKey = extractFileKey(fileUrl);
  const downloadPath = path.join(tempDir, `session_${Date.now()}.mp4`);
  const audioPath = path.join(tempDir, `session_${Date.now()}.mp3`);

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

    console.log(`[AI] Sending to Groq Whisper...`);
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: GROQ_MODELS.TRANSCRIPTION_V3_TURBO,
      response_format: "verbose_json",
    });

    return transcription;
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
  // Logic to get the key from R2 URL
  // Example URL: https://bucket.endpoint.com/path/to/file.mp4
  // Or: bucket.https://domain.com/path
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.startsWith("/") ? urlObj.pathname.substring(1) : urlObj.pathname;
  } catch {
    return url; // Fallback
  }
}
