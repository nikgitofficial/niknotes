import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import VideoNote from "@/models/VideoNote";
import { verifyToken, JWTPayload } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user: JWTPayload = verifyToken(token);
    const body = await req.json();
    
    // Support both single videoUrl and multiple videoUrls
    const { videoUrl, videoUrls, title, videoSizes } = body;
    
    // Determine which format is being used
    let urls: string[];
    if (videoUrls && Array.isArray(videoUrls)) {
      urls = videoUrls;
    } else if (videoUrl) {
      urls = [videoUrl];
    } else {
      return NextResponse.json({ error: "Missing videoUrl or videoUrls" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    if (urls.length === 0) {
      return NextResponse.json({ error: "At least one video URL is required" }, { status: 400 });
    }

    const newVideo = await VideoNote.create({
      userId: user.userId,
      title,
      videoUrls: urls,
      videoSizes: videoSizes || [], // Add videoSizes, default to empty array if not provided
    });

    return NextResponse.json(newVideo, { status: 201 });
  } catch (err: any) {
    console.error("Video save error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) {
      return NextResponse.json([], { status: 200 });
    }

    const user: JWTPayload = verifyToken(token);
    const videos = await VideoNote.find({ userId: user.userId }).sort({ createdAt: -1 });
    
    return NextResponse.json(videos);
  } catch (err: any) {
    console.error("GET videos error:", err);
    return NextResponse.json([], { status: 200 });
  }
}