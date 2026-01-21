"use client";

import { useEffect, useState } from "react";
import { HiOutlineVideoCamera, HiPencil, HiTrash } from "react-icons/hi";

type VideoNoteType = {
  _id: string;
  title: string;
  videoUrl: string;
  createdAt: string;
};

type ToastType = "create" | "update" | "delete";

/* ===========================
   ✅ Direct Blob Upload
   =========================== */
const uploadVideoDirect = async (file: File): Promise<string> => {
  const tokenRes = await fetch("/api/blob/video-token", {
    credentials: "include",
  });

  if (!tokenRes.ok) throw new Error("Failed to get blob token");
  const { token } = await tokenRes.json();

  const uploadRes = await fetch(
    `https://blob.vercel-storage.com/${file.name}?addRandomSuffix=1`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": file.type,
      },
      body: file,
    }
  );

  if (!uploadRes.ok) throw new Error("Blob upload failed");

  const url = uploadRes.headers.get("Location");
  if (!url) throw new Error("No blob URL returned");

  return url;
};

export default function VideoNotes() {
  const [notes, setNotes] = useState<VideoNoteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ title?: string; files?: string }>({});
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes/video", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const validate = () => {
    const errs: { title?: string; files?: string } = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!editingNoteId && files.length === 0) errs.files = "Select at least one video";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setActionLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    if (editingNoteId) formData.append("noteId", editingNoteId);

    try {
      for (const file of files) {
        const url = await uploadVideoDirect(file);
        formData.append("videoUrls", url);
      }

      const res = await fetch("/api/notes/video", {
        method: editingNoteId ? "PUT" : "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (editingNoteId) {
          setNotes(notes.map(n => (n._id === editingNoteId ? data.note : n)));
          showToast("update", "Video note updated");
        } else {
          setNotes([...data.notes, ...notes]);
          showToast("create", `${data.notes.length} video(s) uploaded`);
        }
        closeModal();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/notes/video?noteId=${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setNotes(notes.filter(n => n._id !== deleteId));
        setDeleteModalOpen(false);
        showToast("delete", "Video note deleted");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (note: VideoNoteType) => {
    setEditingNoteId(note._id);
    setTitle(note.title);
    setFiles([]);
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTitle("");
    setFiles([]);
    setEditingNoteId(null);
    setErrors({});
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 relative">
      <h1 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
        <HiOutlineVideoCamera /> Video Notes
      </h1>

      <button
        onClick={() => setModalOpen(true)}
        className="mb-6 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
      >
        Upload Videos
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map(note => (
          <div key={note._id} className="bg-white p-3 rounded-lg shadow relative">
            <video controls src={note.videoUrl} className="w-full rounded mb-2" />
            <h2 className="font-semibold text-green-800">{note.title}</h2>
            <p className="text-xs text-gray-500">
              {new Date(note.createdAt).toLocaleString()}
            </p>

            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={() => openEdit(note)}
                className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <HiPencil />
              </button>
              <button
                onClick={() => {
                  setDeleteId(note._id);
                  setDeleteModalOpen(true);
                }}
                className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                <HiTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ FIXED TOAST (THIS WAS THE BUILD ERROR) */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded text-white z-50 ${
            toast.type === "create"
              ? "bg-green-600"
              : toast.type === "update"
              ? "bg-blue-600"
              : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
