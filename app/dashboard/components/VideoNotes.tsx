"use client";
import { useState, useEffect } from "react";

type VideoNote = {
  _id: string;
  title: string;
  videoUrls: string[];
  createdAt?: string;
};

export default function VideoDashboard() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [videos, setVideos] = useState<VideoNote[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/notes/video", { 
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setVideos(data);
        }
      } else {
        console.error("Failed to fetch videos:", res.status);
      }
    } catch (err) {
      console.error("Failed to fetch videos", err);
    }
  };

  const handleUpload = async () => {
    if (!videoFile) {
      alert("Please select a video first.");
      return;
    }

    // Validate file size (e.g., max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (videoFile.size > maxSize) {
      alert("File is too large. Maximum size is 100MB.");
      return;
    }

    const formData = new FormData();
    formData.append("video", videoFile);

    setIsUploading(true);
    setMessage("");
    setProgress(0);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/notes/video");
      xhr.withCredentials = true;

      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          setVideos((prev) => [response, ...prev]);
          setMessage("✅ Upload successful!");
          setProgress(0);
          setVideoFile(null);
          
          // Clear file input
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) fileInput.value = "";
          
          // Clear success message after 3 seconds
          setTimeout(() => setMessage(""), 3000);
        } else {
          let errorMsg = "Upload failed";
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMsg = errorData.error || errorMsg;
          } catch (e) {
            errorMsg = xhr.responseText || errorMsg;
          }
          setMessage(`❌ ${errorMsg}`);
          console.error("Upload failed:", xhr.status, xhr.responseText);
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        setMessage("❌ Network error occurred during upload");
        console.error("XHR error");
      };

      xhr.ontimeout = () => {
        setIsUploading(false);
        setMessage("❌ Upload timed out");
      };

      xhr.send(formData);
    } catch (err: any) {
      setIsUploading(false);
      setMessage(`❌ Error: ${err.message}`);
      console.error("Upload error:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Upload Video</h2>
        
        <div className="flex flex-col gap-4">
          <div>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {videoFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {isUploading && progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-600 h-4 transition-all duration-300 flex items-center justify-center text-xs text-white font-semibold"
                style={{ width: `${progress}%` }}
              >
                {progress}%
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!videoFile || isUploading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold
              hover:bg-blue-700 active:bg-blue-800
              disabled:bg-gray-400 disabled:cursor-not-allowed
              transition-colors duration-200"
          >
            {isUploading ? "Uploading..." : "Upload Video"}
          </button>

          {message && (
            <div className={`p-3 rounded-md ${
              message.includes("✅") 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Videos Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Videos ({videos.length})</h2>
        
        {videos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500">No videos uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((v) =>
              v.videoUrls.map((url, i) => (
                <div 
                  key={`${v._id}-${i}`} 
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="font-semibold text-lg mb-2 truncate" title={v.title}>
                    {v.title}
                  </p>
                  {v.createdAt && (
                    <p className="text-xs text-gray-500 mb-2">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </p>
                  )}
                  <video 
                    src={url} 
                    controls 
                    className="w-full rounded-md bg-black"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}