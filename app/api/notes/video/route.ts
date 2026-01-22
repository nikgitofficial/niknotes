import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "@/lib/mongodb";
import VideoNote from "@/models/VideoNote";
import { verifyToken, JWTPayload } from "@/lib/jwt";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST: Upload video
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user: JWTPayload = verifyToken(token);

    const formData = await req.formData();
    const file = formData.get("video") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult: { secure_url: string } = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "video" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string });
        }
      );
      stream.end(buffer);
    });

    const newVideo = await VideoNote.create({
      userId: user.userId,
      title: file.name,
      videoUrls: [uploadResult.secure_url],
    });

    return NextResponse.json(newVideo, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// GET: Fetch videos for the logged-in user
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json([], { status: 200 });

    const user: JWTPayload = verifyToken(token);
    const videos = await VideoNote.find({ userId: user.userId }).sort({ createdAt: -1 });

    return NextResponse.json(videos);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json([], { status: 200 });
  }
}
