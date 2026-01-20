import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FileNote from "@/models/FileNote";
import { put } from "@vercel/blob";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let user;
    try {
      user = verifyToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

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
    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let user;
    try { user = verifyToken(token); } catch { return NextResponse.json({ error: "Invalid token" }, { status: 401 }); }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const files = formData.getAll("files") as File[];

    if (!title || files.length === 0) return NextResponse.json({ error: "Missing title or files" }, { status: 400 });

    const createdNotes = [];
    for (const file of files) {
      const blobRes = await put(file.name, file.stream(), {
        access: "public",
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN,
      });
      const newNote = await FileNote.create({ userId: user.userId, title, fileUrl: blobRes.url });
      createdNotes.push(newNote);
    }

    return NextResponse.json({ notes: createdNotes });
  } catch (err: any) {
    console.error("POST /api/notes/file error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let user;
    try { user = verifyToken(token); } catch { return NextResponse.json({ error: "Invalid token" }, { status: 401 }); }

    const formData = await req.formData();
    const noteId = formData.get("noteId") as string;
    const title = formData.get("title") as string;
    const files = formData.getAll("files") as File[];

    if (!noteId || !title) return NextResponse.json({ error: "Missing noteId or title" }, { status: 400 });

    const updatedNotes = [];

    // Update main note title
    const mainNote = await FileNote.findOneAndUpdate({ _id: noteId, userId: user.userId }, { title }, { new: true });
    if (!mainNote) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    updatedNotes.push(mainNote);

    // Add any new files as new notes
    for (const file of files) {
      const blobRes = await put(file.name, file.stream(), {
        access: "public",
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN,
      });
      const newNote = await FileNote.create({ userId: user.userId, title, fileUrl: blobRes.url });
      updatedNotes.push(newNote);
    }

    return NextResponse.json({ notes: updatedNotes });
  } catch (err: any) {
    console.error("PUT /api/notes/file error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let user;
    try { user = verifyToken(token); } catch { return NextResponse.json({ error: "Invalid token" }, { status: 401 }); }

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");
    if (!noteId) return NextResponse.json({ error: "Missing noteId" }, { status: 400 });

    const deletedNote = await FileNote.findOneAndDelete({ _id: noteId, userId: user.userId });
    if (!deletedNote) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/notes/file error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
