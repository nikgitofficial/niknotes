// app/api/notes/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ImageNote from "@/models/ImageNote";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const accessToken = req.cookies.get("accessToken")?.value;
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = verifyToken(accessToken);

    const formData = await req.formData();
    const title = formData.get("title")?.toString();
    const file = formData.get("file") as File;

    if (!title || !file) return NextResponse.json({ error: "Title and file required" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const newNote = await ImageNote.create({
      userId: user.userId,
      title,
      image: buffer,
      contentType: file.type,
    });

    return NextResponse.json({ message: "Image note created", note: newNote });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const accessToken = req.cookies.get("accessToken")?.value;
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = verifyToken(accessToken);

    const notes = await ImageNote.find({ userId: user.userId }).sort({ createdAt: -1 });

    // convert images to base64 to send to client
    const serializedNotes = notes.map(note => ({
      _id: note._id,
      title: note.title,
      image: note.image.toString("base64"),
      contentType: note.contentType,
      createdAt: note.createdAt,
    }));

    return NextResponse.json({ notes: serializedNotes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
