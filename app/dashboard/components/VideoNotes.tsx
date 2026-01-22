"use client";

import { useEffect, useState } from "react";
import { HiX, HiOutlinePhotograph } from "react-icons/hi";

type VideoNote = { _id: string; title: string; videoUrls: string[]; createdAt: string };

/* ===== CLIENT UPLOAD HELPER ===== */
const uploadVideo = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/blob/upload", {
    method: "POST",
    body: formData, // do NOT set Content-Type manually
  });

  if (!res.ok) throw new Error("Upload failed");

  const data = await res.json();
  return data.url; // Vercel Blob returns the public URL
};

export default function VideoNotes() {
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetch("/api/notes/video", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setNotes(d.notes))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!title || files.length === 0) return;
    setSaveLoading(true);
    try {
      const videoUrls = await Promise.all(files.map(uploadVideo));

      const res = await fetch("/api/notes/video", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, videoUrls }),
      });

      const data = await res.json();
      setNotes((prev) => [data.note, ...prev]);
      setModalOpen(false);
      setTitle("");
      setFiles([]);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <p className="p-6 text-center">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <HiOutlinePhotograph /> Video Notes
      </h1>

      <button onClick={() => setModalOpen(true)} className="mb-6 bg-green-700 text-white px-4 py-2 rounded">
        Upload Video
      </button>

      <div className="grid gap-4">
        {notes.map((note) => (
          <div key={note._id} className="bg-white p-3 rounded shadow">
            <h2 className="font-semibold">{note.title}</h2>
            {note.videoUrls.map((url, i) => (
              <video key={i} controls className="w-full mt-2">
                <source src={url} />
              </video>
            ))}
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <button onClick={() => setModalOpen(false)} className="float-right">
              <HiX />
            </button>

            <input
              className="w-full p-2 border mb-3"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input type="file" multiple accept="video/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} />

            <button onClick={handleCreate} disabled={saveLoading} className="mt-4 w-full bg-green-700 text-white py-2 rounded">
              {saveLoading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
