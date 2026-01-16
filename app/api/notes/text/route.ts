import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const accessToken = req.cookies.get("accessToken")?.value;
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = verifyToken(accessToken);

    const { title, content } = await req.json();
    if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 });

    const newNote = await Note.create({
      userId: user.userId,
      title,
      content,
    });

    return NextResponse.json({ message: "Note created", note: newNote });
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

    const notes = await Note.find({ userId: user.userId }).sort({ createdAt: -1 });

    return NextResponse.json({ notes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
