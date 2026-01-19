import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ImageNote from "@/models/ImageNote";
import { verifyToken } from "@/lib/jwt";
import { put } from "@vercel/blob";

/* ========================= GET ========================= */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);

    const notes = await ImageNote.find({ userId: user.userId }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ notes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ========================= POST (CREATE) ========================= */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const images = formData.getAll("images") as File[];

    if (!title || images.length === 0) {
      return NextResponse.json(
        { error: "Title and images required" },
        { status: 400 }
      );
    }

    const uploadedImages = await Promise.all(
      images.map(async (image) => {
        const blob = await put(image.name, image, {
          access: "public",
          addRandomSuffix: true,
        });
        return blob.url;
      })
    );

    const note = await ImageNote.create({
      userId: user.userId,
      title,
      imageUrls: uploadedImages,
    });

    return NextResponse.json({ note });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ========================= PUT (UPDATE) ========================= */
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);

    const formData = await req.formData();
    const noteId = formData.get("noteId") as string;
    const title = formData.get("title") as string;
    const images = formData.getAll("images") as File[];

    if (!noteId || !title) {
      return NextResponse.json(
        { error: "Note ID and title required" },
        { status: 400 }
      );
    }

    const note = await ImageNote.findOne({
      _id: noteId,
      userId: user.userId,
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    let imageUrls = note.imageUrls;

    if (images.length > 0) {
      imageUrls = await Promise.all(
        images.map(async (image) => {
          const blob = await put(image.name, image, {
            access: "public",
            addRandomSuffix: true,
          });
          return blob.url;
        })
      );
    }

    note.title = title;
    note.imageUrls = imageUrls;
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
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json(
        { error: "Note ID required" },
        { status: 400 }
      );
    }

    const deleted = await ImageNote.findOneAndDelete({
      _id: noteId,
      userId: user.userId,
    });

    if (!deleted) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
