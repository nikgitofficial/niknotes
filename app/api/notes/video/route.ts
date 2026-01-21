import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import VideoNote from "@/models/VideoNote";
import { verifyToken } from "@/lib/jwt";
import { put } from "@vercel/blob";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = verifyToken(token);
    const notes = await VideoNote.find({ userId: user.userId }).sort({ createdAt: -1 });
    return NextResponse.json({ notes });
  } catch (err: any) {
    console.error("GET /api/notes/video error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = verifyToken(token);
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const files = formData.getAll("videos") as File[];

    if (!title || files.length === 0)
      return NextResponse.json({ error: "Title and at least one video required" }, { status: 400 });

    const notes = [];
    for (const file of files) {
      const blob = await put(file.name, file.stream(), {
        access: "public",
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN,
      });

      const note = await VideoNote.create({
        userId: user.userId,
        title,
        videoUrl: blob.url,
      });

      notes.push(note);
    }

    return NextResponse.json({ notes });
  } catch (err: any) {
    console.error("POST /api/notes/video error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = verifyToken(token);
    const formData = await req.formData();
    const noteId = formData.get("noteId") as string;
    const title = formData.get("title") as string;
    const files = formData.getAll("videos") as File[];

    if (!noteId || !title) return NextResponse.json({ error: "Missing noteId or title" }, { status: 400 });

    const note = await VideoNote.findById(noteId);
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    if (note.userId !== user.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Update title always
    note.title = title;

    // Only replace video if a new one was uploaded
    if (files.length > 0) {
      const blob = await put(files[0].name, files[0].stream(), {
        access: "public",
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN,
      });
      note.videoUrl = blob.url;
    }

    await note.save();
    return NextResponse.json({ note });
  } catch (err: any) {
    console.error("PUT /api/notes/video error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = verifyToken(token);
    const noteId = req.nextUrl.searchParams.get("noteId");
    if (!noteId) return NextResponse.json({ error: "Missing noteId" }, { status: 400 });

    const note = await VideoNote.findById(noteId);
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    if (note.userId !== user.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await note.deleteOne();
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/notes/video error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
