import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  const username = req.nextUrl.searchParams.get("username");
  
  // Get Authorization header
  const authHeader = req.headers.get("authorization");

  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
  } else if (!username) {
    return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 });
  } else if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  const idToken = authHeader.split("Bearer ")[1];
  let isAdmin = false;

  try {
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch the user's role from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.role === "admin") {
        isAdmin = true;
      }
    }
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY || "placeholder-key";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "placeholder-secret";
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://placeholder.livekit.cloud";

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
  });

  // Grant roomAdmin privileges if the user is an admin
  at.addGrant({ 
    roomJoin: true, 
    room: room, 
    canPublish: true, 
    canSubscribe: true,
    roomAdmin: isAdmin,
  });

  return NextResponse.json({ token: await at.toJwt() });
}
