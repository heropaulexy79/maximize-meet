import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Allow this serverless function to run for up to 300 seconds (Vercel max)
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    // Verify internal secret so only our own server can call this
    const secret = req.headers.get("x-internal-secret");
    const expectedSecret = process.env.INTERNAL_API_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { egressId } = await req.json();

    if (!egressId) {
      return NextResponse.json({ error: "Missing egressId" }, { status: 400 });
    }

    const docRef = adminDb.collection("replays").doc(egressId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: `Replay not found: ${egressId}` }, { status: 404 });
    }

    const data = snapshot.data();
    const fileUrl = data?.fileUrl;

    if (!fileUrl) {
      return NextResponse.json({ error: "No fileUrl on replay document" }, { status: 400 });
    }

    // Mark as processing immediately
    await docRef.update({
      processingStatus: "processing",
      processingError: null,
    });

    try {
      const { transcribeAudio, analyzeSession } = await import("@/lib/ai/service");

      // A. Transcription
      console.log(`[Vault/Process] Starting transcription for egress ${egressId}`);
      const transcriptionResult = await transcribeAudio(fileUrl);
      const transcript = transcriptionResult.text;
      const segments = (transcriptionResult as any).segments || [];

      // B. Analysis
      console.log(`[Vault/Process] Starting analysis for egress ${egressId}`);
      const analytics = await analyzeSession(transcript);

      // C. Save completed results
      await docRef.update({
        transcript,
        transcriptSegments: segments,
        ...analytics,
        processingStatus: "completed",
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`[Vault/Process] COMPLETED for egress ${egressId}`);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error(`[Vault/Process] FAILED for egress ${egressId}:`, error);
      await docRef.update({
        processingStatus: "failed",
        processingError: error.message,
      });
      return NextResponse.json({ error: "Processing failed", details: error.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[Vault/Process] Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
