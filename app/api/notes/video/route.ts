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
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = verifyToken(token);

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const videos = formData.getAll("videos") as File[];

    if (!title || videos.length === 0)
      return NextResponse.json({ error: "Title and videos required" }, { status: 400 });

    const uploadedVideos = await Promise.all(
      videos.map(async (video) => {
        const blob = await put(video.name, video, {
          access: "public",
          addRandomSuffix: true,
          token: process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN,
        });
        return blob.url;
      })
    );

    const note = await VideoNote.create({
      userId: user.userId,
      title,
      videoUrls: uploadedVideos,
    });

    return NextResponse.json({ note });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ========================= PUT ========================= */
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = verifyToken(token);

    const formData = await req.formData();
    const noteId = formData.get("noteId") as string;
    const title = formData.get("title") as string;
    const videos = formData.getAll("videos") as File[];

    if (!noteId || !title)
      return NextResponse.json({ error: "Note ID and title required" }, { status: 400 });

    const note = await VideoNote.findOne({ _id: noteId, userId: user.userId });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    let videoUrls = note.videoUrls;

    if (videos.length > 0) {
      videoUrls = await Promise.all(
        videos.map(async (video) => {
          const blob = await put(video.name, video, { access: "public", addRandomSuffix: true });
          return blob.url;
        })
      );
    }

    note.title = title;
    note.videoUrls = videoUrls;
    await note.save();

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
