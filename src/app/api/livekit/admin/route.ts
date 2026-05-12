import { RoomServiceClient } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const getLiveKitHost = (url: string) => {
  if (!url) return "";
  return url.replace("wss://", "https://").replace("ws://", "http://");
};

const roomService = new RoomServiceClient(
  getLiveKitHost(process.env.NEXT_PUBLIC_LIVEKIT_URL || ""),
  process.env.LIVEKIT_API_KEY || "",
  process.env.LIVEKIT_API_SECRET || ""
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    // Verify token and check admin role
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { action, roomName, identity, trackSid } = await req.json();

    if (!roomName) {
      return NextResponse.json({ error: "roomName is required" }, { status: 400 });
    }

    switch (action) {
      case "kick":
        if (!identity) return NextResponse.json({ error: "identity is required" }, { status: 400 });
        await roomService.removeParticipant(roomName, identity);
        break;

      case "mute":
        if (!identity || !trackSid) return NextResponse.json({ error: "identity and trackSid required" }, { status: 400 });
        await roomService.mutePublishedTrack(roomName, identity, trackSid, true);
        break;

      case "muteAll":
        // Fetch all participants
        const participants = await roomService.listParticipants(roomName);
        
        // Exclude the admin making the request (using decodedToken.email or displayName, ideally identity matches one of these)
        // Note: frontend passes displayName || email as identity.
        const adminEmail = decodedToken.email;
        const adminName = userDoc.data()?.name || userDoc.data()?.displayName;
        
        for (const p of participants) {
          // Skip if it's the admin
          if (p.identity === adminEmail || p.identity === adminName) continue;
          
          // Mute all audio tracks
          for (const track of p.tracks) {
            if (track.type === 1) { // 1 = Audio
              await roomService.mutePublishedTrack(roomName, p.identity, track.sid, true);
            }
          }
        }
        break;

      case "deleteRoom":
        await roomService.deleteRoom(roomName);
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Admin action failed:", error);
    return NextResponse.json({ error: error.message || "Action failed" }, { status: 500 });
  }
}
