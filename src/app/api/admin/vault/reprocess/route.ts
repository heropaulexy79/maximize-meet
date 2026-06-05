import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-wrapper";

export const POST = withSecurity(async (req, user) => {
  try {
    const { egressId } = await req.json();

    if (!egressId) {
      return NextResponse.json({ error: "Missing egressId in request body" }, { status: 400 });
    }

    // Diagnostics
    const hasSecret = !!process.env.INTERNAL_API_SECRET;
    console.log(`[Vault/Reprocess] Secret present: ${hasSecret}`);

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
    // EXCLUSIVELY determine the app URL from the host header to ensure we call ourselves correctly
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host");
    const appUrl = `${protocol}://${host}`;
    
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
      const errStatus = processRes.status;
      const errText = await processRes.text().catch(() => "Unknown error");
      console.error(`[Vault] Reprocess trigger failed for ${egressId}: Status ${errStatus}, Body: ${errText}`);
      
      return NextResponse.json({ 
        error: "Failed to trigger reprocessing", 
        message: `Internal API returned ${errStatus}: ${errText.substring(0, 100)}`
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Reprocessing task queued" });
  } catch (error: any) {
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host");
    const appUrl = `${protocol}://${host}`;
    
    console.error(`[Vault/Reprocess] Unexpected error while calling ${appUrl}:`, error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: `${error.message} (Target: ${appUrl}/api/vault/process)`,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  }
}, { requireAdmin: true });

