import { RoomServiceClient } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, rateLimit } from "@/lib/auth-utils";
import { withSecurity } from "@/lib/api-wrapper";

const getLiveKitHost = (url: string) => {
  if (!url) return "";
  return url.replace("wss://", "https://").replace("ws://", "http://");
};

const roomService = new RoomServiceClient(
  getLiveKitHost(process.env.NEXT_PUBLIC_LIVEKIT_URL || ""),
  process.env.LIVEKIT_API_KEY || "",
  process.env.LIVEKIT_API_SECRET || ""
);

export const POST = withSecurity(async (req, user) => {
  const { action, roomName, identity, trackSid, metadata: bodyMetadata } = await req.json();

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
      const participants = await roomService.listParticipants(roomName);
      // We can't easily get admin email from decoded token here without more work, 
      // but we can skip based on identity if provided in metadata.
      for (const p of participants) {
        // Skip if it's likely the admin (identity matching)
        if (p.identity === identity) continue;
        
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

    case "updateRoom":
      await roomService.updateRoomMetadata(roomName, bodyMetadata);
      break;

    case "updateParticipant":
      if (!identity) return NextResponse.json({ error: "identity is required" }, { status: 400 });
      await roomService.updateParticipant(roomName, identity, bodyMetadata);
      break;

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}, { requireAdmin: true, rateLimitLimit: 30 });
