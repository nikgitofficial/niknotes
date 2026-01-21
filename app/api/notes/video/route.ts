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
  } catch (err) {
    console.error(err);
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

    const videoUrls = formData.getAll("videoUrls") as string[];
    const files = formData.getAll("videos") as File[];

    if (!title || (videoUrls.length === 0 && files.length === 0))
      return NextResponse.json({ error: "Title and video required" }, { status: 400 });

    const notes = [];

    // ✅ PRODUCTION (direct blob upload)
    if (videoUrls.length > 0) {
      for (const url of videoUrls) {
        notes.push(
          await VideoNote.create({
            userId: user.userId,
            title,
            videoUrl: url,
          })
        );
      }
    }

    // ✅ LOCAL DEV fallback
    for (const file of files) {
      const blob = await put(file.name, file.stream(), {
        access: "public",
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      notes.push(
        await VideoNote.create({
          userId: user.userId,
          title,
          videoUrl: blob.url,
        })
      );
    }

    return NextResponse.json({ notes });
  } catch (err) {
    console.error(err);
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
    const videoUrls = formData.getAll("videoUrls") as string[];
    const files = formData.getAll("videos") as File[];

    const note = await VideoNote.findById(noteId);
    if (!note || note.userId !== user.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    note.title = title;

    if (videoUrls.length > 0) {
      note.videoUrl = videoUrls[0];
    } else if (files.length > 0) {
      const blob = await put(files[0].name, files[0].stream(), {
        access: "public",
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      note.videoUrl = blob.url;
    }

    await note.save();
    return NextResponse.json({ note });
  } catch (err) {
    console.error(err);
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

    const note = await VideoNote.findById(noteId);
    if (!note || note.userId !== user.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await note.deleteOne();
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
