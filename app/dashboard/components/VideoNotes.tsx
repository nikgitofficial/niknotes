"use client";
import { useState, useEffect } from "react";

type VideoNote = {
  _id: string;
  title: string;
  videoUrls: string[];
};

export default function VideoDashboard() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [videos, setVideos] = useState<VideoNote[]>([]);

  // Fetch videos on mount
  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch("/api/notes/video", { credentials: "include" });
        const data = await res.json();
        if (Array.isArray(data)) setVideos(data);
      } catch (err) {
        console.error("Failed to fetch videos", err);
      }
    }
    fetchVideos();
  }, []);

  const handleUpload = async () => {
    if (!videoFile) return alert("Select a video first.");

    const formData = new FormData();
    formData.append("video", videoFile);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/notes/video");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          setMessage("Upload successful!");
          setProgress(0);
          setVideos((prev) => [...prev, response]);
        } else {
          setMessage("Upload failed: " + xhr.responseText);
        }
      };

      xhr.onerror = () => setMessage("Upload error.");
      xhr.send(formData);
    } catch (err: any) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
        />
        {progress > 0 && <div>Uploading: {progress}%</div>}
        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Upload Video
        </button>
        {message && <p>{message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {videos.map((v) =>
          v.videoUrls.map((url, i) => (
            <div key={v._id + i} className="border p-2 rounded">
              <p className="font-semibold">{v.title}</p>
              <video src={url} controls className="w-full rounded mt-2" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
