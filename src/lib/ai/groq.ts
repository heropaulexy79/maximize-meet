import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not defined in the environment variables.");
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const GROQ_MODELS = {
  TRANSCRIPTION: "whisper-large-v3",
  TRANSCRIPTION_V3_TURBO: "whisper-large-v3-turbo",
  ANALYSIS: "llama-3.3-70b-versatile",
  TINY: "llama3-8b-8192",
};
