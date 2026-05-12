import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  const username = req.nextUrl.searchParams.get("username");
  
  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
  } else if (!username) {
    return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 });
  }

  let isAdmin = false;
  let finalUsername = username;

  // Get Authorization header
  const authHeader = req.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const idToken = authHeader.split("Bearer ")[1];
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
      console.error("Token verification failed, falling back to guest:", error);
      // Fallback: don't return 401, just treat as non-admin
      finalUsername = `(Auth Error) ${username}`;
    }
  } else {
    // Guest user - prefix username to distinguish
    finalUsername = username;
  }

  const apiKey = process.env.LIVEKIT_API_KEY || "placeholder-key";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "placeholder-secret";

  const at = new AccessToken(apiKey, apiSecret, {
    identity: finalUsername,
  });

  // Grant roomAdmin privileges if the user is an admin
  at.addGrant({ 
    roomJoin: true, 
    room: room, 
    canPublish: true, 
    canSubscribe: true,
    canUpdateOwnMetadata: true,
    roomAdmin: isAdmin,
  });

  return NextResponse.json({ token: await at.toJwt() });
}
