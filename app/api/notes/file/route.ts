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

    const blobRes = await put(file.name, file.stream(), {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN,
    });

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

export async function PUT(req: NextRequest) {
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

    const formData = await req.formData();
    const noteId = formData.get("noteId") as string;
    const title = formData.get("title") as string;
    const file = formData.get("file") as File | null;

    if (!noteId || !title) return NextResponse.json({ error: "Missing noteId or title" }, { status: 400 });

    const updateData: any = { title };

    if (file) {
      const blobRes = await put(file.name, file.stream(), {
        access: "public",
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN,
      });
      updateData.fileUrl = blobRes.url;
    }

    const updatedNote = await FileNote.findOneAndUpdate(
      { _id: noteId, userId: user.userId },
      updateData,
      { new: true }
    );

    if (!updatedNote) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    return NextResponse.json({ note: updatedNote });
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
    try {
      user = verifyToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

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
