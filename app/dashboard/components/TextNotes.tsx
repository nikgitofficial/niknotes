"use client";

import { useEffect, useState } from "react";
import { HiX, HiOutlineDocumentText } from "react-icons/hi";

type Note = { _id: string; title: string; content: string; createdAt: string };

export default function TextNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    message: string;
    type: "create" | "update" | "delete" | "error";
  } | null>(null);

  // Show snackbar
  const showSnackbar = (
    message: string,
    type: "create" | "update" | "delete" | "error" = "create"
  ) => {
    setSnackbar({ message, type });
    setTimeout(() => setSnackbar(null), 3000);
  };

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
      showSnackbar("Failed to fetch notes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

 const handleSaveNote = async () => {
  const newErrors: { title?: string; content?: string } = {};

  if (!noteTitle.trim()) newErrors.title = "Title is required";
  if (!noteContent.trim()) newErrors.content = "Content is required";

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setErrors({});
  setSaveLoading(true);

  try {
    if (editingId) {
      const res = await fetch("/api/notes/text", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: editingId, title: noteTitle, content: noteContent }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(notes.map((n) => (n._id === editingId ? data.note : n)));
        showSnackbar("Note updated successfully", "update");
        resetModal();
      }
    } else {
      const res = await fetch("/api/notes/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: noteTitle, content: noteContent }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNotes([data.note, ...notes]);
        showSnackbar("Note created successfully", "create");
        resetModal();
      }
    }
  } catch (err) {
    console.error(err);
    showSnackbar("Failed to save note", "error");
  } finally {
    setSaveLoading(false);
  }
};


  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/notes/text", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: deletingId }),
        credentials: "include",
      });
      if (res.ok) {
        setNotes(notes.filter((n) => n._id !== deletingId));
        showSnackbar("Note deleted successfully", "delete");
      }
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to delete note", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  const openEditModal = (note: Note) => {
    setEditingId(note._id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setDeletingId(id);
    setDeleteModalOpen(true);
  };

  const resetModal = () => {
    setEditingId(null);
    setNoteTitle("");
    setNoteContent("");
    setModalOpen(false);
  };

  if (loading) return <p className="p-8 text-center">Loading...</p>;

  return (
    <div className="flex flex-col items-start justify-start p-6">
      <h1 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-2">
        <HiOutlineDocumentText /> Text Notes
      </h1>

      {/* New Note Button */}
      <button
        onClick={() => setModalOpen(true)}
        className="mb-6 px-5 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition-all duration-200 text-sm md:text-base"
      >
        New Text Note
      </button>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative">
        {notes.map((note) => (
          <div
            key={note._id}
            className="bg-white p-4 rounded-xl shadow-lg relative hover:shadow-2xl transition-shadow duration-300"
          >
            <h2 className="font-semibold text-green-800 text-lg md:text-xl">{note.title}</h2>
            <p className="text-gray-700 mt-2">{note.content}</p>
            <p className="text-sm text-gray-500 mt-2">{new Date(note.createdAt).toLocaleString()}</p>

            {/* Edit/Delete Buttons */}
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => openEditModal(note)}
                className="px-3 py-1 text-blue-600 font-medium text-sm md:text-base rounded hover:bg-blue-100 transition-colors duration-200"
              >
                Edit
              </button>
              <button
                onClick={() => openDeleteModal(note._id)}
                className="px-3 py-1 text-red-600 font-medium text-sm md:text-base rounded hover:bg-red-100 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Note Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md relative shadow-2xl">
            <button
              onClick={resetModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <HiX size={24} />
            </button>
            <h3 className="text-lg font-bold mb-4 text-black">{editingId ? "Edit Text Note" : "New Text Note"}</h3>
            <input
  type="text"
  placeholder="Title"
  className={`w-full p-3 mb-1 border rounded-lg text-black focus:outline-none focus:ring-2 transition
    ${errors.title ? "border-red-500 focus:ring-red-400" : "focus:ring-green-400"}
  `}
  value={noteTitle}
  onChange={(e) => setNoteTitle(e.target.value)}
/>
{errors.title && (
  <p className="text-red-600 text-sm mb-3">{errors.title}</p>
)}

            <textarea
  placeholder="Content"
  className={`w-full p-3 mb-1 border rounded-lg text-black focus:outline-none focus:ring-2 transition
    ${errors.content ? "border-red-500 focus:ring-red-400" : "focus:ring-green-400"}
  `}
  rows={5}
  value={noteContent}
  onChange={(e) => setNoteContent(e.target.value)}
/>
{errors.content && (
  <p className="text-red-600 text-sm mb-3">{errors.content}</p>
)}

            <button
              onClick={handleSaveNote}
              disabled={saveLoading}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {saveLoading && (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {saveLoading ? (editingId ? "Saving..." : "Creating...") : editingId ? "Save Changes" : "Create Note"}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm relative shadow-2xl flex flex-col items-center">
            <HiX
              size={24}
              className="absolute top-3 right-3 cursor-pointer text-gray-600 hover:text-gray-900 transition-colors duration-200"
              onClick={() => setDeleteModalOpen(false)}
            />
            <h3 className="text-lg font-bold mb-4 text-black text-center">Confirm Delete</h3>
            <p className="text-gray-700 text-center mb-6">Are you sure you want to delete this note?</p>
            <button
              onClick={confirmDelete}
              className="relative w-full py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2"
              disabled={deleteLoading}
            >
              {deleteLoading && (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {deleteLoading ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded shadow-lg text-white
          ${
            snackbar.type === "create"
              ? "bg-green-600"
              : snackbar.type === "update"
              ? "bg-blue-600"
              : snackbar.type === "delete"
              ? "bg-red-600"
              : "bg-gray-600"
          } animate-slide-in`}
        >
          {snackbar.message}
        </div>
      )}

      {/* Tailwind animation */}
      <style jsx>{`
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        @keyframes slide-in {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
