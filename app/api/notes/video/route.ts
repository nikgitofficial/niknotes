import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import VideoNote from "@/models/VideoNote";
import { verifyToken } from "@/lib/jwt";

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
    const videoUrls = formData.getAll("videos") as string[];

    if (!title || videoUrls.length === 0)
      return NextResponse.json({ error: "Title and at least one video required" }, { status: 400 });

    const notes = [];
    for (const url of videoUrls) {
      const note = await VideoNote.create({
        userId: user.userId,
        title,
        videoUrl: url,
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
    const videoUrls = formData.getAll("videos") as string[];

    if (!noteId || !title) return NextResponse.json({ error: "Missing noteId or title" }, { status: 400 });

    const note = await VideoNote.findById(noteId);
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    if (note.userId !== user.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Update title always
    note.title = title;

    // Only replace video if new URLs were sent
    if (videoUrls.length > 0) {
      note.videoUrl = videoUrls[0]; // you can handle multiple URLs if needed
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
