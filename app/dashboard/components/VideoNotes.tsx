"use client";
import { useState, useEffect } from "react";
import { HiPencil, HiTrash, HiX } from "react-icons/hi";

type VideoNote = {
  _id: string;
  title: string;
  videoUrls: string[];
  createdAt?: string;
};

export default function VideoDashboard() {
  const [videoFiles, setVideoFiles] = useState<File[]>([]); // Changed to array
  const [progress, setProgress] = useState<{ [key: string]: number }>({}); // Track progress per file
  const [message, setMessage] = useState("");
  const [videos, setVideos] = useState<VideoNote[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

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
      }
    } catch (err) {
      console.error("Failed to fetch videos", err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setVideoFiles(Array.from(files));
    }
  };

  const removeFile = (index: number) => {
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadSingleVideo = async (file: File, index: number): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Get upload signature
        const signRes = await fetch("/api/cloudinary/sign", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name }),
        });

        if (!signRes.ok) {
          throw new Error("Failed to get upload signature");
        }

        const { signature, timestamp, cloudName, apiKey, folder } = await signRes.json();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("signature", signature);
        formData.append("timestamp", timestamp.toString());
        formData.append("api_key", apiKey);
        formData.append("folder", folder);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(prev => ({ ...prev, [file.name]: percentComplete }));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const cloudinaryResponse = JSON.parse(xhr.responseText);
            resolve(cloudinaryResponse.secure_url);
          } else {
            reject(new Error(`Upload failed for ${file.name}: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error(`Network error for ${file.name}`));
        };

        xhr.send(formData);
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleMultipleUpload = async () => {
    if (videoFiles.length === 0) {
      alert("Please select at least one video.");
      return;
    }

    setIsUploading(true);
    setMessage("");
    setProgress({});

    try {
      // Upload all videos in parallel
      const uploadPromises = videoFiles.map((file, index) => 
        uploadSingleVideo(file, index)
      );

      const uploadedUrls = await Promise.all(uploadPromises);

      // Save all videos to database with a collective title
      const title = videoFiles.length === 1 
        ? videoFiles[0].name 
        : `${videoFiles.length} videos - ${new Date().toLocaleDateString()}`;

      const saveRes = await fetch("/api/notes/video", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrls: uploadedUrls,
          title: title,
        }),
      });

      if (saveRes.ok) {
        const savedVideo = await saveRes.json();
        setVideos((prev) => [savedVideo, ...prev]);
        setMessage(`✅ Successfully uploaded ${videoFiles.length} video(s)!`);
        setProgress({});
        setVideoFiles([]);
      } else {
        throw new Error("Failed to save videos to database");
      }
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = async (videoId: string) => {
    if (!editTitle.trim()) {
      alert("Title cannot be empty");
      return;
    }

    try {
      const res = await fetch(`/api/notes/video/${videoId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });

      if (res.ok) {
        const updatedVideo = await res.json();
        setVideos((prev) =>
          prev.map((v) => (v._id === videoId ? updatedVideo : v))
        );
        setEditingId(null);
        setEditTitle("");
        setMessage("✅ Video title updated!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        throw new Error("Failed to update video");
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video collection?")) {
      return;
    }

    try {
      const res = await fetch(`/api/notes/video/${videoId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v._id !== videoId));
        setMessage("✅ Video deleted!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        throw new Error("Failed to delete video");
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const startEdit = (video: VideoNote) => {
    setEditingId(video._id);
    setEditTitle(video.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const totalProgress = Object.values(progress).reduce((a, b) => a + b, 0) / (videoFiles.length || 1);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Upload Videos</h2>
        
        <div className="flex flex-col gap-4">
          <div>
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleFileSelect}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            
            {videoFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-300">
                  Selected {videoFiles.length} file(s):
                </p>
                {videoFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <span className="text-sm text-gray-900 dark:text-gray-300 truncate flex-1">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    {!isUploading && (
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <HiX size={18} />
                      </button>
                    )}
                    {isUploading && progress[file.name] !== undefined && (
                      <span className="ml-2 text-sm font-semibold text-blue-600">
                        {progress[file.name]}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isUploading && (
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-600 h-4 transition-all duration-300 flex items-center justify-center text-xs text-white font-semibold"
                style={{ width: `${totalProgress}%` }}
              >
                {Math.round(totalProgress)}%
              </div>
            </div>
          )}

          <button
            onClick={handleMultipleUpload}
            disabled={videoFiles.length === 0 || isUploading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold
              hover:bg-blue-700 active:bg-blue-800
              disabled:bg-gray-400 disabled:cursor-not-allowed
              transition-colors duration-200"
          >
            {isUploading ? `Uploading ${videoFiles.length} video(s)...` : `Upload ${videoFiles.length || ''} Video(s)`}
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
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Your Videos ({videos.length})</h2>
        
        {videos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500">No videos uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {videos.map((v) => (
              <div 
                key={v._id} 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Title Section */}
                {editingId === v._id ? (
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-2 py-1 border border-blue-500 rounded text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleEdit(v._id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      <HiX size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-lg" title={v.title}>
                        {v.title}
                      </p>
                      {v.createdAt && (
                        <p className="text-xs text-gray-500">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </p>
                      )}
                      {v.videoUrls.length > 1 && (
                        <p className="text-sm text-blue-600 mt-1">
                          {v.videoUrls.length} videos in this collection
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => startEdit(v)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit title"
                      >
                        <HiPencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(v._id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete video"
                      >
                        <HiTrash size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Videos Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {v.videoUrls.map((url, i) => (
                    <div key={i} className="relative">
                      <video 
                        src={url} 
                        controls 
                        className="w-full rounded-md bg-black"
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                      {v.videoUrls.length > 1 && (
                        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                          {i + 1} / {v.videoUrls.length}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}