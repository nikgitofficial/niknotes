import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import VideoNote from "@/models/VideoNote";
import { verifyToken, JWTPayload } from "@/lib/jwt";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Update video title or sizes
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user: JWTPayload = verifyToken(token);
    const body = await req.json();
    const { title, videoSizes } = body;

    // At least one field must be provided
    if (!title && !videoSizes) {
      return NextResponse.json({ error: "Title or videoSizes is required" }, { status: 400 });
    }

    // Validate title if provided
    if (title !== undefined && (!title || !title.trim())) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }

    // ⭐ Await params
    const { id } = await context.params;

    // Find video and verify ownership
    const video = await VideoNote.findById(id);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.userId.toString() !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update fields
    if (title !== undefined) {
      video.title = title.trim();
    }
    if (videoSizes !== undefined) {
      video.videoSizes = videoSizes;
    }
    
    await video.save();

    return NextResponse.json(video);
  } catch (err: any) {
    console.error("Update video error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const token = req.cookies.get("accessToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user: JWTPayload = verifyToken(token);

    const { id } = await context.params;

    const video = await VideoNote.findById(id);
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });
    if (video.userId.toString() !== user.userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Helper: extract public_id from Cloudinary URL
    const getPublicIdFromUrl = (url: string) => {
      const cleanUrl = url.split('?')[0]; // remove query string
      const parts = cleanUrl.split('/');
      // skip protocol + cloud_name + resource_type + upload
      const uploadIndex = parts.findIndex(p => p === 'upload');
      const relevantParts = uploadIndex >= 0 ? parts.slice(uploadIndex + 1) : parts.slice(6);
      // remove version if exists
      const versionIndex = relevantParts.findIndex(p => p.startsWith('v') && /^\d+$/.test(p.slice(1)));
      const finalParts = versionIndex >= 0 ? relevantParts.slice(versionIndex + 1) : relevantParts;
      // remove file extension
      return finalParts.join('/').replace(/\.[^/.]+$/, '');
    };

    // Delete each video from Cloudinary
    for (const url of video.videoUrls) {
      try {
        const publicId = getPublicIdFromUrl(url);
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        console.log(`Deleted from Cloudinary: ${publicId}`);
      } catch (cloudinaryErr) {
        console.error("Cloudinary deletion error:", cloudinaryErr);
      }
    }

    // Delete from database
    await VideoNote.findByIdAndDelete(id);

    return NextResponse.json({ message: "Video deleted successfully" });
  } catch (err: any) {
    console.error("Delete video error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}