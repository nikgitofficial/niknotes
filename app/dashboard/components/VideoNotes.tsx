"use client";
import { useState, useEffect } from "react";

type VideoNote = {
  _id: string;
  title: string;
  videoUrls: string[];
};

export default function VideoUpload() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [videos, setVideos] = useState<VideoNote[]>([]);

  // Fetch videos on mount
  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch("/api/notes/video");
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
          setVideos((prev) => [...prev, response]); // add new video to list
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

      <div className="space-y-4">
        {videos.map((v) =>
          v.videoUrls.map((url, i) => (
            <div key={v._id + i}>
              <p>{v.title}</p>
              <video src={url} controls className="w-full max-w-md" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
