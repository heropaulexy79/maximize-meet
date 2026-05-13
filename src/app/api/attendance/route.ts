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

    const snapshot = await adminDb
      .collection("attendance")
      .orderBy("joinedAt", "desc")
      .limit(100)
      .get();

    const records = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        identity: data.identity,
        name: data.name,
        roomId: data.roomId || "Unknown Room",
        joinedAt: data.joinedAt ? data.joinedAt.toDate().toISOString() : null,
        leftAt: data.leftAt ? data.leftAt.toDate().toISOString() : null,
        durationSeconds: data.durationSeconds || 0,
      };
    });

    return NextResponse.json({ records });
  } catch (error: any) {
    console.error("Attendance API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
