import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "@/lib/mongodb";
import VideoNote from "@/models/VideoNote";
import { verifyToken, JWTPayload } from "@/lib/jwt";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload video
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get token from cookies
    const token = req.cookies.get("accessToken")?.value;
    
    if (!token) {
      console.error("No access token found in cookies");
      return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 });
    }

    let user: JWTPayload;
    try {
      user = verifyToken(token);
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("video") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`Uploading video: ${file.name}, size: ${file.size} bytes`);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary
    const uploadResult: { secure_url: string } = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { 
          resource_type: "video",
          folder: "niknotes_videos", // Optional: organize in folder
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result as { secure_url: string });
          }
        }
      );
      stream.end(buffer);
    });

    console.log(`Video uploaded successfully: ${uploadResult.secure_url}`);

    // Save to database
    const newVideo = await VideoNote.create({
      userId: user.userId,
      title: file.name,
      videoUrls: [uploadResult.secure_url],
    });

    return NextResponse.json(newVideo, { status: 201 });
  } catch (err: any) {
    console.error("Video upload error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" }, 
      { status: 500 }
    );
  }
}

// Fetch user videos
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    
    if (!token) {
      console.log("No token provided for GET request");
      return NextResponse.json([], { status: 200 });
    }

    try {
      const user: JWTPayload = verifyToken(token);
      const videos = await VideoNote.find({ userId: user.userId }).sort({ createdAt: -1 });
      
      console.log(`Fetched ${videos.length} videos for user ${user.userId}`);
      return NextResponse.json(videos);
    } catch (err) {
      console.error("Token verification failed in GET:", err);
      return NextResponse.json([], { status: 200 });
    }
  } catch (err: any) {
    console.error("GET videos error:", err);
    return NextResponse.json([], { status: 200 });
  }
}