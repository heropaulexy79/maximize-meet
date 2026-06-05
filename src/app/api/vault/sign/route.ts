import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-wrapper";

// S3 Client configuration
// forcePathStyle is required for Cloudflare R2 presigned URL generation
let endpoint = process.env.S3_ENDPOINT || "";
const bucketName = process.env.S3_BUCKET || "";

// If the endpoint contains the bucket name (e.g. accidentally set in env vars),
// strip it to avoid double-prefixing with forcePathStyle: true
if (bucketName && endpoint.endsWith(`/${bucketName}`)) {
  endpoint = endpoint.substring(0, endpoint.length - (bucketName.length + 1));
}

const s3Client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
});

/**
 * Extracts and sanitizes the S3 object key from various URL forms:
 * - https://account.r2.cloudflarestorage.com/bucket/path/to/file.ogg  (path-style)
 * - https://bucket.account.r2.cloudflarestorage.com/path/to/file.ogg  (virtual-hosted)
 * - s3://bucket/path/to/file.ogg
 * - Just the key: path/to/file.ogg or recordings/file.ogg
 */
function sanitizeKey(fileKey: string, bucketName?: string): string {
  let key = fileKey;

  if (!key) return "";

  // 1. Decode recursively to handle nested or double-encoded URLs
  // This handles cases like: bucket/https%3A//host/bucket/recordings/file.ogg
  let lastKey = "";
  while (key.includes('%') && key !== lastKey) {
    try {
      lastKey = key;
      const decoded = decodeURIComponent(key);
      if (decoded === key) break;
      key = decoded;
    } catch {
      break;
    }
  }

  // 2. Handle full https:// or http:// URLs — extract just the pathname
  if (key.startsWith("https://") || key.startsWith("http://")) {
    try {
      const urlObj = new URL(key);
      // pathname starts with "/" — remove it
      key = urlObj.pathname.startsWith("/") ? urlObj.pathname.substring(1) : urlObj.pathname;
    } catch {
      // If URL parsing fails (e.g. invalid host), manual fallback
      const hostEnd = key.indexOf('/', 8);
      if (hostEnd !== -1) {
        key = key.substring(hostEnd + 1);
      }
    }
  }

  // 3. Handle s3:// URLs
  if (key.startsWith("s3://")) {
    const withoutScheme = key.replace("s3://", "");
    // s3://bucket/path -> path
    const parts = withoutScheme.split("/");
    key = parts.length > 1 ? parts.slice(1).join("/") : "";
  }

  // 4. Strip ALL leading occurrences of the bucket name prefix
  // handles path-style where bucket is in the path, and any double-prefixing
  if (bucketName) {
    let changed = true;
    while (changed) {
      changed = false;
      if (key.startsWith(`${bucketName}/`)) {
        key = key.slice(bucketName.length + 1);
        changed = true;
      }
      // Also handle potential double slashes
      if (key.startsWith("/")) {
        key = key.slice(1);
        changed = true;
      }
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

    const sanitizedKey = sanitizeKey(fileKey, bucketName);

    console.log(`[Signing] Original: ${fileKey.substring(0, 50)}... -> Sanitized: ${sanitizedKey}`);

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
