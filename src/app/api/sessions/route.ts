import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-wrapper";

export const POST = withSecurity(async (req, user) => {
  const { title, instructor, time, cohort, status, roomId, recurrence } = await req.json();

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
    recurrence: recurrence || "none",
    createdAt: new Date().toISOString(),
    createdBy: user?.uid,
  });

  return NextResponse.json({ success: true, id: sessionRef.id });
}, { requireAdmin: true });

export const GET = withSecurity(async (req, user) => {
  const now = new Date().toISOString();
  const snapshot = await adminDb.collection("sessions").get();

  const sessions = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as any))
    .filter(session => {
      if (session.status === "live") return true;
      if (session.recurrence && session.recurrence !== "none") return true;
      return session.time >= now;
    })
    .map(session => {
      // SECURITY: Only admins see the actual roomId. 
      // Members only see the session details.
      if (user?.role !== "admin") {
        const { roomId, createdBy, ...publicData } = session;
        return publicData;
      }
      return session;
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  return NextResponse.json({ sessions });
}, { requireAuth: true });

