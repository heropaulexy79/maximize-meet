import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-wrapper";
import * as admin from "firebase-admin";

// Allow this serverless function to run for up to 300 seconds (Vercel max)
export const maxDuration = 300;

export const POST = withSecurity(async (req, user) => {
  try {
    const { egressId } = await req.json();

    if (!egressId) {
      return NextResponse.json({ error: "Missing egressId in request body" }, { status: 400 });
    }

    const docRef = adminDb.collection("replays").doc(egressId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: `Replay not found for ID: ${egressId}` }, { status: 404 });
    }

    const data = snapshot.data();
    const fileUrl = data?.fileUrl;

    if (!fileUrl) {
      return NextResponse.json({ error: `No recording file URL found for replay: ${egressId}` }, { status: 400 });
    }

    // Trigger Knowledge Vault AI Pipeline (Asynchronous)
    (async () => {
      try {
        const { transcribeAudio, analyzeSession } = await import("@/lib/ai/service");
        
        await docRef.update({ 
          processingStatus: "processing",
          processingError: null
        });

        // A. Transcription
        const transcriptionResult = await transcribeAudio(fileUrl);
        const transcript = transcriptionResult.text;
        const segments = (transcriptionResult as any).segments || [];

        // B. Analysis
        const analytics = await analyzeSession(transcript);

        // C. Save to Firestore
        await docRef.update({
          transcript,
          transcriptSegments: segments,
          ...analytics,
          processingStatus: "completed",
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`[Vault] REPROCESS: Knowledge Vault processing COMPLETED for egress ${egressId}`);
      } catch (error: any) {
        console.error(`[Vault] REPROCESS: Knowledge Vault processing FAILED for egress ${egressId}:`, error);
        await docRef.update({ 
          processingStatus: "failed",
          processingError: error.message 
        });
      }
    })();

    return NextResponse.json({ success: true, message: "Reprocessing task queued" });
  } catch (error: any) {
    console.error("Error in reprocess API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, { requireAdmin: true });
