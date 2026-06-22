import {
  EgressClient,
  EncodedFileType,
  EncodedOutputs,
} from "livekit-server-sdk";
import { EncodedFileOutput, GCPUpload, S3Upload } from "@livekit/protocol";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, rateLimit } from "@/lib/auth-utils";
import { withSecurity } from "@/lib/api-wrapper";

const getLiveKitHost = (url: string) => {
  if (!url) return "";
  return url.replace("wss://", "https://").replace("ws://", "http://");
};

const egressClient = new EgressClient(
  getLiveKitHost(process.env.NEXT_PUBLIC_LIVEKIT_URL || ""),
  process.env.LIVEKIT_API_KEY || "",
  process.env.LIVEKIT_API_SECRET || ""
);

export const POST = withSecurity(async (req, user) => {
  const { action, roomName, egressId, meetingTitle } = await req.json();

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
      
      let output: any = undefined;

      if (s3Bucket && s3AccessKey && s3SecretKey) {
        output = {
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
        output = {
          case: "gcp",
          value: new GCPUpload({
            credentials: gcpCredentials,
            bucket: gcpBucket,
          }),
        };
      }

      const sanitizedTitle = meetingTitle 
        ? meetingTitle.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") 
        : roomName;

      const fileOutput = new EncodedFileOutput({
        fileType: EncodedFileType.OGG,
        filepath: `recordings/${sanitizedTitle}-{time}.ogg`,
        output,
      });

      try {
        const egress = await egressClient.startRoomCompositeEgress(
          roomName,
          {
            file: fileOutput,
          },
          {
            audioOnly: true,
          }
        );

        return NextResponse.json({
          success: true,
          egressId: egress.egressId,
          status: egress.status,
        });
      } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to start recording" }, { status: 400 });
      }
    }

    // ── STOP ───────────────────────────────────────────────────────────────
    if (action === "stop") {
      if (!egressId) {
        return NextResponse.json(
          { error: "egressId is required" },
          { status: 400 }
        );
      }

      try {
        const egress = await egressClient.stopEgress(egressId);

        return NextResponse.json({
          success: true,
          status: egress.status,
        });
      } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to stop recording" }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}, { requireAdmin: true, rateLimitLimit: 5 });
