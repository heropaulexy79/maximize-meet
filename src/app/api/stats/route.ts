import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-wrapper";

export const GET = withSecurity(async (req, user) => {
  // Verified Admin Check is handled by requireAdmin: true in options
  const statsSnap = await adminDb.collection("stats").doc("global").get();
  const stats = statsSnap.data() || { totalLearningSeconds: 0, totalParticipantEntries: 0, updatedAt: null };

  return NextResponse.json({ 
    totalLearningHours: Math.round((stats.totalLearningSeconds || 0) / 3600),
    totalParticipantEntries: stats.totalParticipantEntries || 0,
    updatedAt: stats.updatedAt ? (typeof stats.updatedAt.toDate === 'function' ? stats.updatedAt.toDate().toISOString() : stats.updatedAt) : null
  });
}, { requireAdmin: true });
