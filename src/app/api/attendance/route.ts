import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("Unauthorized access attempt: Missing or invalid authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Verify admin role
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Only fetch records from the last 30 days by default to save quota
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [attendanceSnapshot, sessionsSnapshot] = await Promise.all([
      adminDb.collection("attendance")
        .where("joinedAt", ">=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .get(),
      adminDb.collection("sessions").get()
    ]);

    const sessionMap = new Map();
    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.roomId) sessionMap.set(data.roomId, data.title);
    });

    const grouped: Record<string, any> = {};

    attendanceSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const roomId = data.roomId || "Unknown Room";
      const identity = data.identity;
      
      if (!grouped[roomId]) {
        grouped[roomId] = {
          roomId,
          title: sessionMap.get(roomId) || "Unnamed Session",
          participants: {} // Group by identity within session
        };
      }

      const participantGroup = grouped[roomId].participants;
      const joinedAt = data.joinedAt && typeof data.joinedAt.toDate === "function" 
        ? data.joinedAt.toDate() 
        : (data.joinedAt ? new Date(data.joinedAt) : null);
        
      const leftAt = data.leftAt && typeof data.leftAt.toDate === "function"
        ? data.leftAt.toDate()
        : (data.leftAt ? new Date(data.leftAt) : null);
      const duration = data.durationSeconds || 0;

      if (!participantGroup[identity]) {
        participantGroup[identity] = {
          id: doc.id,
          identity,
          name: data.name,
          joinedAt: joinedAt,
          leftAt: leftAt,
          durationSeconds: duration,
          isOnline: !leftAt
        };
      } else {
        const p = participantGroup[identity];
        // Earliest join time
        if (joinedAt && (!p.joinedAt || joinedAt < p.joinedAt)) {
          p.joinedAt = joinedAt;
        }
        // Latest leave time (if null, they are still in room)
        if (!leftAt || !p.leftAt || leftAt > p.leftAt) {
          p.leftAt = leftAt;
        }
        // Always online if any record has no leftAt
        if (!leftAt) p.isOnline = true;
        // Sum duration
        p.durationSeconds += duration;
      }
    });

    const sessions = Object.values(grouped).map((session: any) => ({
      ...session,
      records: Object.values(session.participants)
        .map((p: any) => ({
          ...p,
          joinedAt: p.joinedAt ? p.joinedAt.toISOString() : null,
          leftAt: p.leftAt ? p.leftAt.toISOString() : null,
        }))
        .sort((a, b) => {
          const dateA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
          const dateB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
          return dateB - dateA; // desc
        })
    }));

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("Critical Error in Attendance API:", error);
    return NextResponse.json({ 
      error: error.message || "Internal Server Error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  }
}
