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
    const isAdmin = userDoc.exists && userDoc.data()?.role === "admin";

    if (!isAdmin) {
      // For non-admins, we could return user-specific stats here in the future
      return NextResponse.json({ totalLearningHours: 0 });
    }

    const statsSnap = await adminDb.collection("stats").doc("global").get();
    const stats = statsSnap.data() || { totalLearningSeconds: 0, totalParticipantEntries: 0, updatedAt: null };

    return NextResponse.json({ 
      totalLearningHours: Math.round((stats.totalLearningSeconds || 0) / 3600),
      totalParticipantEntries: stats.totalParticipantEntries || 0,
      updatedAt: stats.updatedAt ? (typeof stats.updatedAt.toDate === 'function' ? stats.updatedAt.toDate().toISOString() : stats.updatedAt) : null
    });

  } catch (error: any) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
