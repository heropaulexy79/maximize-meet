import {
  EgressClient,
  EncodedFileType,
  EncodedOutputs,
} from "livekit-server-sdk";
import { EncodedFileOutput, GCPUpload, S3Upload } from "@livekit/protocol";
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

      const s3Bucket = process.env.S3_BUCKET || "";
      const s3AccessKey = process.env.S3_ACCESS_KEY || "";
      const s3SecretKey = process.env.S3_SECRET_KEY || "";
      const s3Region = process.env.S3_REGION || "";
      const s3Endpoint = process.env.S3_ENDPOINT || "";

      const gcpBucket = process.env.FIREBASE_STORAGE_BUCKET || "";
      const gcpCredentials = process.env.GCP_CREDENTIALS || "";
      
      let outputCase: any = { case: undefined };

      if (s3Bucket && s3AccessKey && s3SecretKey) {
        outputCase = {
          case: "s3",
          value: new S3Upload({
            accessKey: s3AccessKey,
            secret: s3SecretKey,
            region: s3Region,
            endpoint: s3Endpoint,
            bucket: s3Bucket,
          }),
        };
      } else if (gcpBucket && gcpCredentials && gcpCredentials.includes("{")) {
        outputCase = {
          case: "gcp",
          value: new GCPUpload({ credentials: gcpCredentials, bucket: gcpBucket }),
        };
      }

      const fileOutput = new EncodedFileOutput({
        fileType: EncodedFileType.MP4,
        filepath: `recordings/${roomName}-{time}.mp4`,
        output: outputCase,
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
