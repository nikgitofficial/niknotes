import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import VideoNote from "@/models/VideoNote";
import { verifyToken } from "@/lib/jwt";
import { put } from "@vercel/blob";

/* ========================= GET ========================= */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = verifyToken(token);
    const notes = await VideoNote.find({ userId: user.userId }).sort({ createdAt: -1 });
    return NextResponse.json({ notes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ========================= POST ========================= */
// Accept only metadata: title and uploaded video URLs
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = verifyToken(token);
    const { title, videoUrls } = await req.json();

    if (!title || !videoUrls || !videoUrls.length)
      return NextResponse.json({ error: "Title and video URLs required" }, { status: 400 });

    const note = await VideoNote.create({
      userId: user.userId,
      title,
      videoUrls,
    });

    return NextResponse.json({ note });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ========================= DELETE ========================= */
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = verifyToken(token);

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) return NextResponse.json({ error: "Note ID required" }, { status: 400 });

    const deleted = await VideoNote.findOneAndDelete({ _id: noteId, userId: user.userId });
    if (!deleted) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ========================= UPLOAD URL GENERATOR ========================= */
export async function PUT(req: NextRequest) {
  // This generates signed URLs for client to upload directly
  try {
    const { filenames } = await req.json();
    if (!filenames || !filenames.length) return NextResponse.json({ error: "No filenames provided" }, { status: 400 });

    const uploadUrls = await Promise.all(
      filenames.map(async (name) => {
        const blob = await put(name, null, {
          access: "public",
          addRandomSuffix: true,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        return { url: blob.url, formData: blob.formData };
      })
    );

    return NextResponse.json({ uploadUrls });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
