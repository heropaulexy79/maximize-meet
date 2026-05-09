import {
  EgressClient,
  EncodedFileType,
  EncodedOutputs,
} from "livekit-server-sdk";
import { EncodedFileOutput, GCPUpload } from "@livekit/protocol";
import { NextRequest, NextResponse } from "next/server";

const getLiveKitHost = (url: string) => {
  if (!url) return "";
  return url.replace("wss://", "https://").replace("ws://", "http://");
};

const egressClient = new EgressClient(
  getLiveKitHost(process.env.NEXT_PUBLIC_LIVEKIT_URL || ""),
  process.env.LIVEKIT_API_KEY || "",
  process.env.LIVEKIT_API_SECRET || ""
);

export async function POST(req: NextRequest) {
  try {
    const { action, roomName, egressId } = await req.json();

    // ── START ──────────────────────────────────────────────────────────────
    if (action === "start") {
      if (!roomName) {
        return NextResponse.json(
          { error: "roomName is required" },
          { status: 400 }
        );
      }

      const bucket = process.env.FIREBASE_STORAGE_BUCKET || "";
      const credentials = process.env.GCP_CREDENTIALS || "";
      
      // Basic check for credentials
      const hasStorage =
        bucket &&
        credentials &&
        credentials.includes("{") && // Simple JSON check
        credentials !== "paste-your-service-account-json-here";

      // Build EncodedFileOutput using the protobuf-es style.
      // EgressClient expects EncodedOutputs which contains a list of outputs or a single one.
      const fileOutput = new EncodedFileOutput({
        fileType: EncodedFileType.MP4,
        filepath: `recordings/${roomName}-{time}.mp4`,
        output: hasStorage
          ? {
              case: "gcp",
              value: new GCPUpload({ credentials, bucket }),
            }
          : { case: undefined },
      });

      const egress = await egressClient.startRoomCompositeEgress(
        roomName,
        {
          file: fileOutput,
        }
      );

      return NextResponse.json({
        success: true,
        egressId: egress.egressId,
        status: egress.status,
      });
    }

    // ── STOP ───────────────────────────────────────────────────────────────
    if (action === "stop") {
      if (!egressId) {
        return NextResponse.json(
          { error: "egressId is required" },
          { status: 400 }
        );
      }

      const egress = await egressClient.stopEgress(egressId);

      return NextResponse.json({
        success: true,
        status: egress.status,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Recording error:", error);
    return NextResponse.json(
      { error: error.message || "Recording failed" },
      { status: 500 }
    );
  }
}
