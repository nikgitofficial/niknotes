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

   const blob = await put(image.name, image, {
  access: "public",
  addRandomSuffix: true,
  token: process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN,
});

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
