import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, checkRoomAccess, rateLimit } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  // 1. Rate Limiting
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  if (!rateLimit(`livekit-token-${ip}`, 10, 60 * 1000)) { // 10 requests per minute per IP
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const room = req.nextUrl.searchParams.get("room");
  const username = req.nextUrl.searchParams.get("username");
  
  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
  } else if (!username) {
    return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 });
  }

  // 2. Verified Authentication
  const user = await verifyAuth(req);
  if (!user) {
    // If strict access is enabled, we could block guests here. 
    // For now, let's prefix guest names as a security measure.
    if (process.env.STRICT_ROOM_ACCESS === "true") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
  }

  // 3. Strict Room Access Check
  if (user) {
    const hasAccess = await checkRoomAccess(user.uid, room, user.role);
    if (!hasAccess) {
      return NextResponse.json({ error: "You are not authorized to join this room" }, { status: 403 });
    }
  }

  const isAdmin = user?.role === "admin";
  const finalUsername = user ? (user.email?.split("@")[0] || user.uid.substring(0, 5)) : `Guest-${username.substring(0, 10)}`;

  const apiKey = process.env.LIVEKIT_API_KEY || "placeholder-key";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "placeholder-secret";

  const at = new AccessToken(apiKey, apiSecret, {
    identity: finalUsername,
    metadata: JSON.stringify({
      role: isAdmin ? "admin" : "member",
      isGuest: !user,
      uid: user?.uid || null
    })
  });

  at.addGrant({ 
    roomJoin: true, 
    room: room, 
    canPublish: true, 
    canSubscribe: true,
    canUpdateOwnMetadata: false, // SECURITY: Disable client-side metadata updates to prevent escalation
    roomAdmin: isAdmin,
  });

  return NextResponse.json({ token: await at.toJwt() });
}
