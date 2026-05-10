import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Verify admin role
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { title, instructor, time, cohort, status, roomId, recurrence } = body;

    if (!title || !instructor || !time || !cohort) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sessionRef = await adminDb.collection("sessions").add({
      title,
      instructor,
      time,
      cohort,
      status: status || "scheduled",
      roomId: roomId || null,
      recurrence: recurrence || "none", // "none" | "daily" | "weekly" | "monthly"
      createdAt: new Date().toISOString(),
      createdBy: decodedToken.uid,
    });

    return NextResponse.json({ 
      success: true, 
      id: sessionRef.id 
    });

  } catch (error: any) {
    console.error("Error in sessions API:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create session" 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const now = new Date().toISOString();

    const snapshot = await adminDb
      .collection("sessions")
      .orderBy("time", "asc")
      .get();

    const sessions = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(session => {
        // Always keep live sessions
        if (session.status === "live") return true;
        // Keep recurring sessions always (they repeat)
        if (session.recurrence && session.recurrence !== "none") return true;
        // Filter out past one-time sessions
        return session.time >= now;
      });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

