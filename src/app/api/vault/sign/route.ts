import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-wrapper";

// S3 Client configuration
const s3Client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
});

/**
 * Extracts and sanitizes the S3 object key from various URL forms:
 * - https://bucket.endpoint.com/bucket/path/to/file.ogg
 * - s3://bucket/path/to/file.ogg
 * - Just the key: path/to/file.ogg
 */
function sanitizeKey(fileKey: string, bucketName?: string): string {
  let key = fileKey;

  // Handle s3:// URLs
  if (key.startsWith("s3://")) {
    const withoutScheme = key.replace("s3://", "");
    // s3://bucket/path -> path
    key = withoutScheme.split("/").slice(1).join("/");
  }

  // Strip all leading occurrences of the bucket name prefix
  if (bucketName) {
    while (key.startsWith(`${bucketName}/`)) {
      key = key.slice(bucketName.length + 1);
    }
  }

  return key;
}

export const POST = withSecurity(async (req, user) => {
  try {
    const { fileKey } = await req.json();

    if (!fileKey) {
      return NextResponse.json({ error: "fileKey is required" }, { status: 400 });
    }

    const bucketName = process.env.S3_BUCKET;
    const sanitizedKey = sanitizeKey(fileKey, bucketName);

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: sanitizedKey,
    });

    // Generate a signed URL that expires in 15 minutes (900 seconds)
    const signedUrl = await getSignedUrl(s3Client as any, command, { expiresIn: 900 });

    return NextResponse.json({ url: signedUrl });
  } catch (error: any) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}, { requireAuth: true });
