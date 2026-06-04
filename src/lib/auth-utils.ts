import { adminAuth, adminDb } from "./firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: "admin" | "member";
}

/**
 * Verifies the Firebase ID token and checks the user's role in Firestore.
 */
export async function verifyAuth(req: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: (userData?.role === "admin") ? "admin" : "member",
    };
  } catch (error) {
    console.error("Auth verification failed:", error);
    return null;
  }
}

/**
 * Checks if a user has access to a specific room.
 */
export async function checkRoomAccess(uid: string, roomId: string, role: string): Promise<boolean> {
  if (role === "admin") return true;

  // Check if session exists and user is part of the cohort or allowed participants
  const sessionSnap = await adminDb.collection("sessions").where("roomId", "==", roomId).get();
  if (sessionSnap.empty) return false;

  // If session is public or has no restrictions, allow. 
  const session = sessionSnap.docs[0].data();
  if (!session.restricted) return true; 

  // Check if user is explicitly allowed in the participants list or cohort
  const isAllowed = session.allowedParticipants?.includes(uid) || 
                   session.cohort === "public" ||
                   false; // Add more granular cohort checks here

  return isAllowed;
}

/**
 * Simple in-memory rate limiter (per-instance)
 * Note: In a real production app, use Redis or a similar shared store.
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
