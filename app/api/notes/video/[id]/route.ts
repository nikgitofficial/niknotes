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

// Update video title
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
    const { title } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
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

    // Update title
    video.title = title.trim();
    await video.save();

    return NextResponse.json(video);
  } catch (err: any) {
    console.error("Update video error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Delete video
export async function DELETE(
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

    // Delete from Cloudinary
    for (const url of video.videoUrls) {
      try {
        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/{cloud_name}/video/upload/v{version}/{public_id}.{format}
        const urlParts = url.split('/');
        const fileWithExt = urlParts[urlParts.length - 1];
        const publicId = fileWithExt.split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const fullPublicId = `${folder}/${publicId}`;

        await cloudinary.uploader.destroy(fullPublicId, { resource_type: 'video' });
        console.log(`Deleted from Cloudinary: ${fullPublicId}`);
      } catch (cloudinaryErr) {
        console.error("Cloudinary deletion error:", cloudinaryErr);
        // Continue even if Cloudinary deletion fails
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