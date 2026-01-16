"use client";

import { useEffect, useState } from "react";
import { HiOutlinePhotograph, HiX } from "react-icons/hi";

type ImageNote = {
  _id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
};

export default function ImageNotes() {
  const [notes, setNotes] = useState<ImageNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchNotes = async () => {
    const res = await fetch("/api/notes/image", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setNotes(data.notes);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleUpload = async () => {
    if (!title || !file) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("image", file);

    const res = await fetch("/api/notes/image", {
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
        <HiOutlinePhotograph />
        Image Notes
      </h1>

      <button
        onClick={() => setModalOpen(true)}
        className="mb-6 bg-green-700 text-white px-4 py-2 rounded"
      >
        Upload Image
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {notes.map((note) => (
          <div key={note._id} className="bg-white p-3 rounded-lg shadow">
            <img
              src={note.imageUrl}
              alt={note.title}
              className="h-48 w-full object-cover rounded mb-2"
            />
            <h2 className="font-semibold text-green-800">{note.title}</h2>
            <p className="text-xs text-gray-500">
              {new Date(note.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3"
            >
              <HiX size={24} />
            </button>

            <h3 className="font-bold mb-3">New Image Note</h3>

            <input
              type="text"
              placeholder="Title"
              className="w-full p-2 border mb-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
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
