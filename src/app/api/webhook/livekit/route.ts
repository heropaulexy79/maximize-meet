import { WebhookReceiver } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY || "",
  process.env.LIVEKIT_API_SECRET || ""
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Verify and parse the webhook event
    const event = await receiver.receive(body, authHeader);
    const eventTime = new Date(); // Use current server time when webhook is received

    // ─── PARTICIPANT JOINED ───────────────────────────────────────────────
    if (event.event === "participant_joined") {
      const { room, participant } = event;
      if (room && participant) {
        const docRef = adminDb
          .collection("rooms")
          .doc(room.name)
          .collection("attendance")
          .doc(participant.sid);

        await docRef.set({
          identity: participant.identity,
          name: participant.name || participant.identity || "Unknown",
          joinedAt: admin.firestore.Timestamp.fromDate(eventTime),
          leftAt: null,
          durationSeconds: 0,
        }, { merge: true });
        
        console.log(`[Attendance] Recorded JOIN for ${participant.identity} in room ${room.name}`);
      }
    } 
    // ─── PARTICIPANT LEFT ─────────────────────────────────────────────────
    else if (event.event === "participant_left") {
      const { room, participant } = event;
      if (room && participant) {
        const docRef = adminDb
          .collection("rooms")
          .doc(room.name)
          .collection("attendance")
          .doc(participant.sid);

        // Fetch to calculate duration
        const doc = await docRef.get();
        let durationSeconds = 0;
        
        if (doc.exists) {
          const data = doc.data();
          if (data?.joinedAt) {
            // joinedAt is a Firestore Timestamp
            const joinedTime = data.joinedAt.toMillis();
            durationSeconds = Math.max(0, Math.floor((eventTime.getTime() - joinedTime) / 1000));
          }
        }

        await docRef.set({
          leftAt: admin.firestore.Timestamp.fromDate(eventTime),
          durationSeconds: durationSeconds,
        }, { merge: true });
        
        console.log(`[Attendance] Recorded LEAVE for ${participant.identity} in room ${room.name} (Duration: ${durationSeconds}s)`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Invalid webhook", details: error.message },
      { status: 400 }
    );
  }
}
