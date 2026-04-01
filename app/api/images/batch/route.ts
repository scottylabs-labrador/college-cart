import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, BUCKET } from "@/lib/s3";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { keys } = (await req.json()) as { keys: string[] };

    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ urls: {} });
    }

    const entries = await Promise.all(
      keys.map(async (key) => {
        const url = await getSignedUrl(
          s3,
          new GetObjectCommand({ Bucket: BUCKET, Key: key }),
          { expiresIn: 3600 }
        );
        return [key, url] as const;
      })
    );

    const urls: Record<string, string> = Object.fromEntries(entries);
    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Error in batch images API route:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URLs" },
      { status: 500 }
    );
  }
}
