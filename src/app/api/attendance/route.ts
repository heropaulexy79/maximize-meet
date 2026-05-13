import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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

    const [attendanceSnapshot, sessionsSnapshot] = await Promise.all([
      adminDb.collection("attendance").orderBy("joinedAt", "desc").get(),
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
      const joinedAt = data.joinedAt ? data.joinedAt.toDate() : null;
      const leftAt = data.leftAt ? data.leftAt.toDate() : null;
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
      records: Object.values(session.participants).map((p: any) => ({
        ...p,
        joinedAt: p.joinedAt ? p.joinedAt.toISOString() : null,
        leftAt: p.leftAt ? p.leftAt.toISOString() : null,
      }))
    }));

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("Attendance API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
