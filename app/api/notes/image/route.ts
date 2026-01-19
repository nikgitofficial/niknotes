import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ImageNote from "@/models/ImageNote";
import { verifyToken } from "@/lib/jwt";
import { put } from "@vercel/blob";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);

    const notes = await ImageNote.find({ userId: user.userId }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ notes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const image = formData.get("image") as File;

    if (!title || !image) {
      return NextResponse.json(
        { error: "Title and image required" },
        { status: 400 }
      );
    }

    // Use your current environment variable explicitly
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN;
    if (!blobToken) {
      return NextResponse.json(
        { error: "Blob token not found in environment" },
        { status: 500 }
      );
    }

    let blob;
    try {
      blob = await put(image.name, image, {
        access: "public",
        addRandomSuffix: true,
        token: blobToken, // explicitly provide token
      });
    } catch (uploadError) {
      console.error("Blob upload failed:", uploadError);
      return NextResponse.json(
        { error: "Blob upload failed" },
        { status: 500 }
      );
    }

    const note = await ImageNote.create({
      userId: user.userId,
      title,
      imageUrl: blob.url,
    });

    return NextResponse.json({ note });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
