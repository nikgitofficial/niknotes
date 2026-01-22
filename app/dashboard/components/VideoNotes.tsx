"use client";

import { useEffect, useState } from "react";
import { HiX, HiOutlinePhotograph, HiPencil, HiTrash } from "react-icons/hi";

type VideoNote = { _id: string; title: string; videoUrls: string[]; createdAt: string };

/* ===== CLIENT UPLOAD HELPER ===== */
const uploadVideo = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/blob/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");

  const data = await res.json();
  return data.url; // the URL from Vercel Blob
};

export default function VideoNotes() {
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editNote, setEditNote] = useState<VideoNote | null>(null);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetch("/api/notes/video", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setNotes(d.notes))
      .finally(() => setLoading(false));
  }, []);

  /* ===== CREATE or EDIT ===== */
  const handleSave = async () => {
    if (!title || (files.length === 0 && !editNote)) return;
    setSaveLoading(true);

    try {
      const videoUrls = files.length > 0 ? await Promise.all(files.map(uploadVideo)) : editNote?.videoUrls || [];

      const res = await fetch(editNote ? "/api/notes/video" : "/api/notes/video", {
        method: editNote ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editNote
            ? { noteId: editNote._id, title, videoUrls }
            : { title, videoUrls }
        ),
      });

      const data = await res.json();

      if (editNote) {
        setNotes((prev) => prev.map((n) => (n._id === editNote._id ? data.note : n)));
      } else {
        setNotes((prev) => [data.note, ...prev]);
      }

      setModalOpen(false);
      setEditNote(null);
      setTitle("");
      setFiles([]);
    } finally {
      setSaveLoading(false);
    }
  };

  /* ===== DELETE ===== */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/notes/video?noteId=${id}`, { method: "DELETE", credentials: "include" });
    setNotes((prev) => prev.filter((n) => n._id !== id));
  };

  /* ===== OPEN EDIT MODAL ===== */
  const openEditModal = (note: VideoNote) => {
    setEditNote(note);
    setTitle(note.title);
    setFiles([]);
    setModalOpen(true);
  };

  if (loading) return <p className="p-6 text-center">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <HiOutlinePhotograph /> Video Notes
      </h1>

      <button
        onClick={() => setModalOpen(true)}
        className="mb-6 bg-green-700 text-white px-4 py-2 rounded"
      >
        Upload Video
      </button>

      <div className="grid gap-4">
        {notes.map((note) => (
          <div key={note._id} className="bg-white p-3 rounded shadow relative">
            <h2 className="font-semibold flex justify-between items-center">
              {note.title}
              <div className="flex gap-2">
                <button onClick={() => openEditModal(note)} className="text-blue-600 hover:text-blue-800">
                  <HiPencil />
                </button>
                <button onClick={() => handleDelete(note._id)} className="text-red-600 hover:text-red-800">
                  <HiTrash />
                </button>
              </div>
            </h2>
            {note.videoUrls.map((url, i) => (
              <video key={i} controls className="w-full mt-2">
                <source src={url} />
              </video>
            ))}
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-md relative">
            <button onClick={() => { setModalOpen(false); setEditNote(null); }} className="absolute top-3 right-3">
              <HiX />
            </button>

            <input
              className="w-full p-2 border mb-3"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              type="file"
              multiple
              accept="video/*"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />

            <button
              onClick={handleSave}
              disabled={saveLoading}
              className="mt-4 w-full bg-green-700 text-white py-2 rounded"
            >
              {saveLoading ? "Saving..." : editNote ? "Update" : "Upload"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
