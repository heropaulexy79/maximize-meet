import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-wrapper";

export const GET = withSecurity(async (req, user, params) => {
  try {
    const { cohortId } = params;

    if (!cohortId) {
      return NextResponse.json({ error: "cohortId is required" }, { status: 400 });
    }

    const snapshot = await adminDb.collection("replays")
      .where("category", "==", cohortId) // Assuming category stores the cohort name/ID
      .get();

    let totalSessions = snapshot.size;
    let totalSeconds = 0;
    let totalInsights = 0;
    let totalActionItems = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalSeconds += data.durationSeconds || 0;
      totalInsights += (data.leadershipPrinciples?.length || 0) + (data.strategicInsights?.length || 0);
      totalActionItems += (data.actionSteps?.length || 0);
    });

    const stats = {
      totalSessions,
      totalHours: Math.round(totalSeconds / 3600),
      totalInsights,
      totalActionItems,
      cohortName: cohortId
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error("Error fetching cohort stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, { requireAuth: true });
