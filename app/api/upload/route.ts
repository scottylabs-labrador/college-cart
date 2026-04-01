import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, BUCKET } from "@/lib/s3";
import { NextRequest, NextResponse } from "next/server";

// Returns a presigned URL the browser can PUT to directly
export async function POST(req: NextRequest) {
  try {
    const { filename, contentType } = await req.json();
    // Use a unique key for the listing image
    const key = `listings/${Date.now()}-${filename.replace(/\s+/g, "-")}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 600 });

    return NextResponse.json({ url, key });
  } catch (error) {
    console.error("Error generating presigned upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
