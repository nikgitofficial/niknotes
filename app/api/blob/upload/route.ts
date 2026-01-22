import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: false, // required to handle FormData
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload file to Vercel Blob
    const blob = await put(file.name, file.stream(), {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN,
    });

    return NextResponse.json(blob); // { url: string, key, size, contentType... }
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
