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

export const POST = withSecurity(async (req, user) => {
  try {
    const { fileKey } = await req.json();

    if (!fileKey) {
      return NextResponse.json({ error: "fileKey is required" }, { status: 400 });
    }

    // Sanitize fileKey: Remove leading bucket name if it was accidentally included
    let sanitizedKey = fileKey;
    const bucketName = process.env.S3_BUCKET;
    if (bucketName && sanitizedKey.startsWith(`${bucketName}/`)) {
      sanitizedKey = sanitizedKey.replace(`${bucketName}/`, "");
    }

    // SECURITY: Ensure the user has permission to access this file.
    // For now, we allow all authenticated users, but you can add more checks here.
    
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
