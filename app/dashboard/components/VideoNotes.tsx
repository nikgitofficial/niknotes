"use client";

import { useEffect, useState } from "react";
import { HiX, HiOutlinePhotograph } from "react-icons/hi";

type VideoNote = {
  _id: string;
  title: string;
  videoUrls: string[];
  createdAt: string;
};

export default function VideoNotes() {
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    message: string;
    type: "create" | "update" | "delete" | "error";
  } | null>(null);

  const showSnackbar = (
    message: string,
    type: "create" | "update" | "delete" | "error" = "create"
  ) => {
    setSnackbar({ message, type });
    setTimeout(() => setSnackbar(null), 3000);
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes/video", { credentials: "include" });
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

  /* ---------------- CREATE ---------------- */
  const handleCreate = async () => {
    if (!title.trim() || files.length === 0) {
      showSnackbar("Title and at least one video required", "error");
      return;
    }

    setSaveLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    files.forEach((file) => formData.append("videos", file));

    try {
      const res = await fetch("/api/notes/video", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setNotes([data.note, ...notes]);
        showSnackbar("Video note created", "create");
        closeModal();
      } else {
        showSnackbar("Failed to create note", "error");
      }
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to create note", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  /* ---------------- UPDATE ---------------- */
  const handleUpdate = async () => {
    if (!editingNoteId) return;

    if (!title.trim()) {
      showSnackbar("Title is required", "error");
      return;
    }

    setSaveLoading(true);
    const formData = new FormData();
    formData.append("noteId", editingNoteId);
    formData.append("title", title);
    files.forEach((file) => formData.append("videos", file));

    try {
      const res = await fetch("/api/notes/video", {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setNotes(notes.map((n) => (n._id === data.note._id ? data.note : n)));
        showSnackbar("Video note updated", "update");
        closeModal();
      } else {
        showSnackbar("Failed to update note", "error");
      }
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to update note", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async () => {
    if (!deletingNoteId) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/notes/video?noteId=${deletingNoteId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setNotes(notes.filter((n) => n._id !== deletingNoteId));
        showSnackbar("Video note deleted", "delete");
        setDeleteModalOpen(false);
        setDeletingNoteId(null);
      } else {
        showSnackbar("Failed to delete note", "error");
      }
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to delete note", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEdit = (note: VideoNote) => {
    setEditingNoteId(note._id);
    setTitle(note.title);
    setFiles([]);
    setModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setDeletingNoteId(id);
    setDeleteModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTitle("");
    setFiles([]);
    setEditingNoteId(null);
  };

  if (loading) return <p className="p-6 text-center">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
        <HiOutlinePhotograph /> Video Notes
      </h1>

      <button
        onClick={() => setModalOpen(true)}
        className="mb-6 bg-green-700 text-white px-4 py-2 rounded"
      >
        Upload Video
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map((note) => (
          <div key={note._id} className="bg-white p-3 rounded-lg shadow relative">
            <h2 className="font-semibold text-green-800 mb-2">{note.title}</h2>
            <p className="text-xs text-gray-500 mb-2">
              {new Date(note.createdAt).toLocaleString()}
            </p>

            <div className="space-y-2">
              {(note.videoUrls ?? []).map((url, i) => (
                <video key={i} controls className="w-full rounded">
                  <source src={url} />
                </video>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => openEdit(note)}
                className="flex-1 bg-blue-600 text-white text-sm py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => openDeleteModal(note._id)}
                className="flex-1 bg-red-600 text-white text-sm py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for create/edit */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative text-black">
            <button onClick={closeModal} className="absolute top-3 right-3">
              <HiX size={24} />
            </button>

            <h3 className="font-bold mb-3">{editingNoteId ? "Edit Video Note" : "New Video Note"}</h3>

            <input
              type="text"
              placeholder="Title"
              className="w-full p-2 mb-2 border rounded border-gray-300"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="mb-4"
            />

            {files.length > 0 && (
              <div className="space-y-2 mb-4">
                {files.map((file, i) => (
                  <video key={i} controls className="w-full rounded">
                    <source src={URL.createObjectURL(file)} />
                  </video>
                ))}
              </div>
            )}

            <button
              onClick={editingNoteId ? handleUpdate : handleCreate}
              disabled={saveLoading}
              className="w-full px-4 py-2 rounded text-white bg-green-700 flex items-center justify-center gap-2"
            >
              {saveLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : editingNoteId ? "Update" : "Upload"}
            </button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm relative text-black">
            <HiX
              size={24}
              className="absolute top-3 right-3 cursor-pointer"
              onClick={() => setDeleteModalOpen(false)}
            />
            <h3 className="font-bold mb-3 text-center">Confirm Delete</h3>
            <p className="text-gray-700 mb-4 text-center">
              Are you sure you want to delete this video note?
            </p>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="w-full py-2 bg-red-600 text-white rounded"
            >
              {deleteLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto block animate-spin"></span>
              ) : (
                "Confirm Delete"
              )}
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
