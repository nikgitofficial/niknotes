"use client";
import { useState, useEffect, useRef } from "react";
import { HiPencil, HiTrash, HiX, HiVideoCamera, HiCamera } from "react-icons/hi";

type VideoNote = {
  _id: string;
  title: string;
  videoUrls: string[];
  createdAt?: string;
  videoSizes?: number[]; // Array of file sizes in bytes
};

export default function VideoDashboard() {
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [message, setMessage] = useState("");
  const [videos, setVideos] = useState<VideoNote[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Camera states
  const [recording, setRecording] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Timer state
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Camera facing mode
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // NEW: Full-screen camera state
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  // Video durations state - stores duration for each video by URL
  const [videoDurations, setVideoDurations] = useState<{ [url: string]: number }>({});

  const xhrRefs = useRef<{ [key: string]: XMLHttpRequest }>({});

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Helper function to format video duration
  const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to get video duration
  const getVideoDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.onerror = () => {
        resolve(0);
      };
      video.src = url;
    });
  };

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
          fetchMissingSizes(data);
          // Fetch durations for all videos
          fetchVideoDurations(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch videos", err);
    }
  };

  // Function to fetch video durations
  const fetchVideoDurations = async (videosList: VideoNote[]) => {
    const durationsMap: { [url: string]: number } = {};
    
    for (const video of videosList) {
      for (const url of video.videoUrls) {
        try {
          const duration = await getVideoDuration(url);
          durationsMap[url] = duration;
        } catch (err) {
          console.error(`Failed to get duration for ${url}`, err);
          durationsMap[url] = 0;
        }
      }
    }
    
    setVideoDurations(durationsMap);
  };

  const fetchMissingSizes = async (videosList: VideoNote[]) => {
    const videosNeedingSizes = videosList.filter(
      v => !v.videoSizes || v.videoSizes.length === 0
    );

    if (videosNeedingSizes.length === 0) return;

    for (const video of videosNeedingSizes) {
      try {
        const sizes = await Promise.all(
          video.videoUrls.map(async (url) => {
            try {
              const response = await fetch(url, { method: 'HEAD' });
              const contentLength = response.headers.get('content-length');
              return contentLength ? parseInt(contentLength) : 0;
            } catch {
              return 0;
            }
          })
        );

        if (sizes.some(s => s > 0)) {
          await fetch(`/api/notes/video/${video._id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoSizes: sizes }),
          });

          setVideos(prev => 
            prev.map(v => 
              v._id === video._id 
                ? { ...v, videoSizes: sizes }
                : v
            )
          );
        }
      } catch (err) {
        console.error(`Failed to fetch sizes for video ${video._id}`, err);
      }
    }
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // NEW: Open full-screen camera
  const openFullScreenCamera = async () => {
    setIsFullScreen(true);
    await startCamera();
  };

  // NEW: Close full-screen camera
  const closeFullScreenCamera = () => {
    closeCamera();
    setIsFullScreen(false);
  };

  // Function to start camera
  const startCamera = async () => {
    try {
      cameraStream?.getTracks().forEach(track => track.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true,
      });
      setCameraStream(stream);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Cannot access camera. Please check permissions or camera may be in use by another app.");
    }
  };

  // Function to close camera
  const closeCamera = () => {
    cameraStream?.getTracks().forEach(track => track.stop());
    setCameraStream(null);
    
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }
  };

  const startRecording = () => {
    if (!cameraStream) return;

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(cameraStream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);

      const blob = new Blob(chunks, { type: "video/webm" });
      const file = new File([blob], `recorded_${Date.now()}.webm`, { type: "video/webm" });
      setVideoFiles((prev) => [...prev, file]);
      showToast("success", "✅ Video recorded and ready to upload!");
    };

    recorder.start();
    setRecording(true);

    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (videoPreviewRef.current && cameraStream) {
      videoPreviewRef.current.srcObject = cameraStream;
      videoPreviewRef.current.play().catch(err => console.log("Video play error:", err));
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach(track => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cameraStream]);

  useEffect(() => {
    if (facingMode && cameraStream) startCamera();
  }, [facingMode]);

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
        const useUnsignedUpload = file.type === "video/webm";
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
        const formData = new FormData();

        formData.append("file", file, file.name);
        formData.append("resource_type", "video");

        if (useUnsignedUpload) {
          formData.append("upload_preset", "unsigned_videos");
          formData.append("folder", "niknotes_videos");
        } else {
          const signRes = await fetch("/api/cloudinary/sign", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name }),
          });

          if (!signRes.ok) throw new Error("Failed to get upload signature");

          const { signature, timestamp, apiKey, folder } = await signRes.json();
          formData.append("signature", signature);
          formData.append("timestamp", timestamp.toString());
          formData.append("api_key", apiKey);
          if (folder) formData.append("folder", folder);
        }

        const xhr = new XMLHttpRequest();
        xhrRefs.current[file.name] = xhr;
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress((prev) => ({ ...prev, [file.name]: percentComplete }));
          }
        };

        xhr.onload = () => {
          delete xhrRefs.current[file.name];
          if (xhr.status === 200) {
            const cloudinaryResponse = JSON.parse(xhr.responseText);
            resolve(cloudinaryResponse.secure_url);
          } else {
            try {
              const errResp = JSON.parse(xhr.responseText);
              reject(new Error(`Upload failed for ${file.name}: ${xhr.status} - ${errResp.error?.message || "Bad Request"}`));
            } catch {
              reject(new Error(`Upload failed for ${file.name}: ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => {
          delete xhrRefs.current[file.name];
          reject(new Error(`Network error for ${file.name}`));
        };

        xhr.send(formData);
      } catch (err) {
        reject(err);
      }
    });
  };

  const cancelUpload = () => {
    Object.values(xhrRefs.current).forEach((xhr) => xhr.abort());
    xhrRefs.current = {};
    setIsUploading(false);
    setMessage("❌ Upload canceled");
    setProgress({});
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
      const uploadPromises = videoFiles.map((file, index) => 
        uploadSingleVideo(file, index)
      );

      const uploadedUrls = await Promise.all(uploadPromises);

      const title = videoFiles.length === 1 
        ? videoFiles[0].name 
        : `${videoFiles.length} videos - ${new Date().toLocaleDateString()}`;

      const videoSizes = videoFiles.map(file => file.size);

      const saveRes = await fetch("/api/notes/video", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrls: uploadedUrls,
          title: title,
          videoSizes: videoSizes,
        }),
      });

      if (saveRes.ok) {
        const savedVideo = await saveRes.json();
        setVideos((prev) => [savedVideo, ...prev]);
        showToast("success", `✅ Successfully uploaded ${videoFiles.length} video(s)!`);
        setProgress({});
        setVideoFiles([]);
        setMessage("");
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

  const openEditModal = (video: VideoNote) => {
    setEditingId(video._id);
    setEditTitle(video.title);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingId(null);
    setEditTitle("");
  };

  const handleEdit = async () => {
    if (!editTitle.trim()) {
      alert("Title cannot be empty");
      return;
    }

    if (!editingId) return;

    setEditLoading(true);
    try {
      const res = await fetch(`/api/notes/video/${editingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });

      if (res.ok) {
        const updatedVideo = await res.json();
        setVideos((prev) =>
          prev.map((v) => (v._id === editingId ? updatedVideo : v))
        );
        closeEditModal();
        showToast("update", "Video title updated!");
      } else {
        throw new Error("Failed to update video");
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteModal = (videoId: string) => {
    setDeletingId(videoId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingId(null);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/notes/video/${deletingId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v._id !== deletingId));
        closeDeleteModal();
        showToast("delete", "Video deleted!");
      } else {
        throw new Error("Failed to delete video");
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalProgress = Object.values(progress).reduce((a, b) => a + b, 0) / (videoFiles.length || 1);

  return (
    <>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md relative">
          {/* Toast inside upload section */}
          {toast && (
            <div
              className={`absolute top-2 left-1/2 -translate-x-1/2
                px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg text-white
                z-50 text-sm sm:text-base max-w-[90%] sm:max-w-md text-center
                ${
                  toast.type === "success" ? "bg-green-600" :
                  toast.type === "update" ? "bg-blue-600" :
                  toast.type === "delete" ? "bg-red-600" :
                  "bg-gray-600"
                }`}
            >
              {toast.message}
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <HiVideoCamera className="text-2xl sm:text-3xl" />
            <span>Upload Videos</span>
          </h2>
          
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* NEW: Full-screen camera button */}
            <button
              onClick={openFullScreenCamera}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              <HiCamera className="text-xl" />
              Open Full-Screen Camera
            </button>

            <div>
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleFileSelect}
                disabled={isUploading}
                className="block w-full text-xs sm:text-sm text-gray-500
                  file:mr-3 sm:file:mr-4 file:py-2 file:px-3 sm:file:px-4
                  file:rounded-md file:border-0
                  file:text-xs sm:file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              
              {videoFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-300">
                      Selected {videoFiles.length} file(s):
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                      Total: {formatFileSize(videoFiles.reduce((acc, file) => acc + file.size, 0))}
                    </p>
                  </div>
                  {videoFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-300 truncate flex-1">
                        {file.name} ({formatFileSize(file.size)})
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
                        <span className="ml-2 text-xs sm:text-sm font-semibold text-blue-600">
                          {progress[file.name]}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isUploading && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
                  <div
                    className="bg-blue-600 h-3 sm:h-4 transition-all duration-300 flex items-center justify-center text-xs text-white font-semibold"
                    style={{ width: `${totalProgress}%` }}
                  >
                    {Math.round(totalProgress)}%
                  </div>
                </div>
                <button
                  onClick={cancelUpload}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm sm:text-base"
                >
                  Cancel Upload
                </button>
              </>
            )}

            <button
              onClick={handleMultipleUpload}
              disabled={videoFiles.length === 0 || isUploading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-semibold
                hover:bg-blue-700 active:bg-blue-800
                disabled:bg-gray-400 disabled:cursor-not-allowed
                transition-colors duration-200 text-sm sm:text-base"
            >
              {isUploading ? `Uploading ${videoFiles.length} video(s)...` : `Upload ${videoFiles.length || ''} Video(s)`}
            </button>

            {message && (
              <div className={`p-3 rounded-md text-sm sm:text-base ${
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
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
            Your Videos ({videos.length})
          </h2>
          
          {videos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <HiVideoCamera className="mx-auto text-6xl mb-3 opacity-30 text-gray-500" />
              <p className="text-gray-500 text-sm sm:text-base">No videos uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {videos.map((v) => (
                <div 
                  key={v._id} 
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Title Section */}
                  <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-semibold text-base sm:text-lg break-words" title={v.title}>
                        {v.title}
                      </p>
                      {v.createdAt && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {v.videoUrls.length > 1 && (
                          <p className="text-xs sm:text-sm text-blue-600">
                            {v.videoUrls.length} videos
                          </p>
                        )}
                        {v.videoSizes && v.videoSizes.length > 0 ? (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            • Total size: {formatFileSize(v.videoSizes.reduce((acc, size) => acc + size, 0))}
                          </p>
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 italic">
                            • Size unavailable
                          </p>
                        )}
                        {/* Show total duration if available */}
                        {v.videoUrls.some(url => videoDurations[url]) && (
                          <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">
                            • Duration: {formatDuration(
                              v.videoUrls.reduce((total, url) => total + (videoDurations[url] || 0), 0)
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(v)}
                        className="p-2 sm:p-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors touch-manipulation"
                        title="Edit title"
                      >
                        <HiPencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(v._id)}
                        className="p-2 sm:p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors touch-manipulation"
                        title="Delete video"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Videos Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {v.videoUrls.length > 1 && (
                            <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                              {i + 1} / {v.videoUrls.length}
                            </div>
                          )}
                          {v.videoSizes && v.videoSizes[i] && (
                            <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                              {formatFileSize(v.videoSizes[i])}
                            </div>
                          )}
                        </div>
                        {/* Duration badge - bottom right */}
                        {videoDurations[url] && (
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-semibold">
                            {formatDuration(videoDurations[url])}
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

        {/* Edit Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg w-full max-w-md relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={closeEditModal} 
                className="absolute top-3 right-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white z-10"
              >
                <HiX size={24} />
              </button>
              <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 pr-8 text-gray-900 dark:text-white">
                Edit Video Title
              </h3>

              <input
                type="text"
                placeholder="Video title"
                className="w-full p-2 sm:p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                autoFocus
              />

              <button
                onClick={handleEdit}
                disabled={editLoading || !editTitle.trim()}
                className="bg-blue-600 text-white px-4 py-2 sm:py-3 rounded w-full flex justify-center items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
              >
                {editLoading && <span className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Update Title
              </button>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-lg w-full max-w-sm relative shadow-2xl flex flex-col items-center">
              <HiX 
                size={24} 
                className="absolute top-3 right-3 cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white" 
                onClick={closeDeleteModal} 
              />
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <HiTrash className="text-red-600 text-2xl sm:text-3xl" />
              </div>
              <h3 className="font-bold text-lg sm:text-xl mb-2 text-center text-gray-900 dark:text-white">
                Confirm Delete
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-5 sm:mb-6 text-sm sm:text-base">
                Are you sure you want to delete this video collection? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 py-2 sm:py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 py-2 sm:py-2.5 bg-red-600 text-white rounded hover:bg-red-700 flex justify-center items-center gap-2 transition-colors disabled:opacity-50 text-sm sm:text-base font-medium"
                >
                  {deleteLoading && <span className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NEW: Full-Screen Camera Modal */}
      {isFullScreen && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          {/* Camera Preview */}
          <div className="flex-1 relative">
            <video
              ref={videoPreviewRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            
            {/* Timer Overlay */}
            {recording && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                {Math.floor(recordingTime / 60).toString().padStart(2, "0")}:{(recordingTime % 60).toString().padStart(2, "0")}
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={closeFullScreenCamera}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
            >
              <HiX size={28} />
            </button>
          </div>

          {/* Controls */}
          <div className="bg-gradient-to-t from-black to-transparent p-6 space-y-4">
            {/* Recording Button */}
            <div className="flex justify-center">
              {!recording ? (
                <button
                  onClick={startRecording}
                  className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95"
                >
                  <div className="w-16 h-16 border-4 border-white rounded-full"></div>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95"
                >
                  <div className="w-8 h-8 bg-white rounded"></div>
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setFacingMode(facingMode === "user" ? "environment" : "user")}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full font-semibold backdrop-blur-sm transition-all"
              >
                Flip Camera
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}