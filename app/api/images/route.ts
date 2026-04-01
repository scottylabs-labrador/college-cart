import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, BUCKET } from "@/lib/s3";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    
    // If a specific key is provided, return a presigned URL for that key
    if (key) {
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn: 3600 }
      );
      return NextResponse.json({ url });
    }

    // Otherwise, list images with a prefix (default: listings/)
    const prefix = req.nextUrl.searchParams.get("prefix") || "listings/";

    const { Contents = [] } = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
    );

    // Generate presigned read URLs for each image
    const images = await Promise.all(
      Contents.map(async (obj) => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        url: await getSignedUrl(
          s3,
          new GetObjectCommand({ Bucket: BUCKET, Key: obj.Key! }),
          { expiresIn: 3600 }
        ),
      }))
    );

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error in images API route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
