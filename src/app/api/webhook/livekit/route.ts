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
        // Use a flat collection for easier querying and better performance
        const docRef = adminDb.collection("attendance").doc(`${room.name}_${participant.sid}`);

        await docRef.set({
          roomId: room.name,
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
        const docRef = adminDb.collection("attendance").doc(`${room.name}_${participant.sid}`);

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
    // ─── RECORDING FINISHED ───────────────────────────────────────────────
    else if (event.event === "egress_ended") {
      const egressInfo = event.egressInfo;
      if (egressInfo) {
        let fileUrl = "";
        if (egressInfo.fileResults && egressInfo.fileResults.length > 0) {
          fileUrl = egressInfo.fileResults[0].location;
        } else if ((egressInfo as any).file && (egressInfo as any).file.location) {
          fileUrl = (egressInfo as any).file.location;
        }

        // 1. Resolve Dynamic Title from Sessions collection
        let title = `Session Recording: ${egressInfo.roomName}`;
        let instructor = "Academy Instructor";
        let category = "Live Session";

        try {
          const sessionsSnapshot = await adminDb.collection("sessions")
            .where("roomId", "==", egressInfo.roomName)
            .limit(1)
            .get();
          
          if (!sessionsSnapshot.empty) {
            const sessionData = sessionsSnapshot.docs[0].data();
            title = sessionData.title || title;
            instructor = sessionData.instructor || instructor;
            category = sessionData.cohort || category;
          }
        } catch (error) {
          console.error("[Vault] Error resolving session title:", error);
        }

        // 2. Generate Dynamic Thumbnail based on Title
        const encodedTitle = encodeURIComponent(title);
        const thumbnailUrl = `https://dynamic-og-image-generator.vercel.app/api/generate?title=${encodedTitle}&author=MAXIMIZE%20NATION&theme=dark&color=%231a2080`;

        // 3. Sanitize fileUrl (fix malformed R2/S3 URLs)
        if (fileUrl) {
          // Fix cases like "bucket.https//..." or "https//..."
          fileUrl = fileUrl.replace(/^[a-zA-Z0-9-]+\.https\/\//, "https://");
          fileUrl = fileUrl.replace(/^https\/\//, "https://");
        }

        const docRef = adminDb.collection("replays").doc(egressInfo.egressId);
        
        let durationSeconds = 0;
        const startedAt = Number(egressInfo.startedAt);
        const endedAt = Number(egressInfo.endedAt);
        if (startedAt && endedAt) {
          if (startedAt > 1e16) {
            durationSeconds = Math.floor((endedAt - startedAt) / 1e9);
          } else {
            durationSeconds = Math.floor((endedAt - startedAt));
          }
        }

        await docRef.set({
          id: egressInfo.egressId,
          roomId: egressInfo.roomName,
          title: title,
          instructor: instructor,
          category: category,
          date: admin.firestore.Timestamp.fromDate(eventTime),
          durationSeconds: durationSeconds,
          fileUrl: fileUrl,
          thumbnail: thumbnailUrl,
          status: egressInfo.status,
          error: egressInfo.error || null
        }, { merge: true });
        
        console.log(`[Vault] Recorded egress_ended for room ${egressInfo.roomName} with title: ${title}`);
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
