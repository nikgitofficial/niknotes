import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const fileName = req.headers.get("x-file-name");
  if (!fileName || !req.body) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const blob = await put(fileName, req.body, {
    access: "public",
    addRandomSuffix: true,
    token: process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN,
  });

  return NextResponse.json({ url: blob.url });
}
