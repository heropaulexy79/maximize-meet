import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-wrapper";

export const POST = withSecurity(async (req, user) => {
  try {
    const { egressId } = await req.json();

    if (!egressId) {
      return NextResponse.json({ error: "Missing egressId in request body" }, { status: 400 });
    }

    const docRef = adminDb.collection("replays").doc(egressId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: `Replay not found for ID: ${egressId}` }, { status: 404 });
    }

    const data = snapshot.data();
    const fileUrl = data?.fileUrl;

    if (!fileUrl) {
      return NextResponse.json({ error: `No recording file URL found for replay: ${egressId}` }, { status: 400 });
    }

    // Delegate to the dedicated processing route which has maxDuration=300
    // Dynamically determine the app URL from the host header to avoid issues with misconfigured env vars
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    
    console.log(`[Vault/Reprocess] Triggering internal processing at ${appUrl}/api/vault/process`);

    const processRes = await fetch(`${appUrl}/api/vault/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
      },
      body: JSON.stringify({ egressId }),
    });

    if (!processRes.ok) {
      const errData = await processRes.json().catch(() => ({}));
      console.error(`[Vault] Reprocess trigger failed for ${egressId}:`, errData);
      return NextResponse.json({ error: "Failed to trigger reprocessing" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Reprocessing task queued" });
  } catch (error: any) {
    console.error("Error in reprocess API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, { requireAdmin: true });

