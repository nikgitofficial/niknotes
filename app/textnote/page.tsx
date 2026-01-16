"use client";

import { useEffect, useState } from "react";
import { HiX, HiOutlineDocumentText } from "react-icons/hi";

type Note = { _id: string; title: string; content: string; createdAt: string };

export default function TextNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // Fetch notes
  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes/text", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async () => {
    if (!noteTitle || !noteContent) return;
    try {
      const res = await fetch("/api/notes/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: noteTitle, content: noteContent }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNotes([data.note, ...notes]);
        setNoteTitle("");
        setNoteContent("");
        setModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="p-8">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
        <HiOutlineDocumentText /> Text Notes
      </h1>

      <button
        onClick={() => setModalOpen(true)}
        className="mb-4 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition"
      >
        New Text Note
      </button>

      {/* Notes list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map((note) => (
          <div key={note._id} className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold text-green-800">{note.title}</h2>
            <p className="text-gray-700 mt-2">{note.content}</p>
            <p className="text-sm text-gray-500 mt-2">
              {new Date(note.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Create Note Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
            >
              <HiX size={24} />
            </button>
            <h3 className="text-lg font-bold mb-4 text-black">New Text Note</h3>
            <input
              type="text"
              placeholder="Title"
              className="w-full p-2 mb-3 border rounded text-black"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />
            <textarea
              placeholder="Content"
              className="w-full p-2 mb-3 border rounded text-black"
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
            <button
              onClick={handleCreateNote}
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition"
            >
              Create Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
