import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FileNote from "@/models/FileNote";
import { put } from "@vercel/blob";
import { verifyToken } from "@/lib/jwt"; // make sure you have your JWT helper

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // get user from token
    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let user;
    try {
      user = verifyToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // fetch only notes for this user
    const notes = await FileNote.find({ userId: user.userId }).sort({ createdAt: -1 });
    return NextResponse.json({ notes });
  } catch (err: any) {
    console.error("GET /api/notes/file error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // get user from token
    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let user;
    try {
      user = verifyToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const file = formData.get("file") as File;

    if (!title || !file) {
      return NextResponse.json({ error: "Missing title or file" }, { status: 400 });
    }

    // Upload to Vercel Blob
   const blobRes = await put(file.name, file.stream(), {
   access: "public",
   addRandomSuffix: true, // avoid collisions
   });

    // Save note with userId
    const newNote = await FileNote.create({
      userId: user.userId,
      title,
      fileUrl: blobRes.url,
    });

    return NextResponse.json({ note: newNote });
  } catch (err: any) {
    console.error("POST /api/notes/file error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
