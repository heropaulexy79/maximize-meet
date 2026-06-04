import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { withSecurity } from "@/lib/api-wrapper";

export const GET = withSecurity(async (req, user) => {
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
        participants: {}
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
      if (joinedAt && (!p.joinedAt || joinedAt < p.joinedAt)) p.joinedAt = joinedAt;
      if (!leftAt || !p.leftAt || leftAt > p.leftAt) p.leftAt = leftAt;
      if (!leftAt) p.isOnline = true;
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
        return dateB - dateA;
      })
  }));

  return NextResponse.json({ sessions });
}, { requireAdmin: true, rateLimitLimit: 20 });
