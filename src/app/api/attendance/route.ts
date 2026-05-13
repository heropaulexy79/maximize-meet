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
      
      if (!grouped[roomId]) {
        grouped[roomId] = {
          roomId,
          title: sessionMap.get(roomId) || "Unnamed Session",
          records: []
        };
      }

      grouped[roomId].records.push({
        id: doc.id,
        identity: data.identity,
        name: data.name,
        joinedAt: data.joinedAt ? data.joinedAt.toDate().toISOString() : null,
        leftAt: data.leftAt ? data.leftAt.toDate().toISOString() : null,
        durationSeconds: data.durationSeconds || 0,
      });
    });

    const sessions = Object.values(grouped);

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("Attendance API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
