"use client";

import { useEffect, useState } from "react";
import { HiOutlinePaperClip, HiX } from "react-icons/hi";

type FileNoteType = {
  _id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
};

export default function FileNotes() {
  const [notes, setNotes] = useState<FileNoteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchNotes = async () => {
    const res = await fetch("/api/notes/file", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setNotes(data.notes);
    }
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, []);

  const handleUpload = async () => {
    if (!title || !file) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", file);

    const res = await fetch("/api/notes/file", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      setNotes([data.note, ...notes]);
      setTitle("");
      setFile(null);
      setModalOpen(false);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
        <HiOutlinePaperClip /> File Notes
      </h1>

      <button
        onClick={() => setModalOpen(true)}
        className="mb-6 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
      >
        Upload File
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map(note => (
          <div key={note._id} className="bg-white p-4 rounded-lg shadow">
            <a
              href={note.fileUrl}
              target="_blank"
              className="text-green-800 font-semibold underline"
            >
              {note.title}
            </a>
            <p className="text-xs text-gray-500">
              {new Date(note.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-3 right-3">
              <HiX size={24} />
            </button>

            <h3 className="font-bold mb-3">Upload File</h3>

            <input
              type="text"
              placeholder="Title"
              className="w-full p-2 border mb-3"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />

            <input
              type="file"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="mb-4"
            />

            <button
              onClick={handleUpload}
              className="bg-green-700 text-white px-4 py-2 rounded w-full"
            >
              Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
