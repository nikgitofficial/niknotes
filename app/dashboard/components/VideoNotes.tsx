"use client";

import { useEffect, useState } from "react";
import { HiOutlineVideoCamera, HiX, HiPencil, HiTrash } from "react-icons/hi";

type VideoNoteType = {
  _id: string;
  title: string;
  videoUrl: string;
  createdAt: string;
};

type ToastType = "create" | "update" | "delete";

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
  
  // Toast
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes/video", { credentials: "include" });
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
    if (files.length > 0) files.forEach(f => formData.append("videos", f));
    if (editingNoteId) formData.append("noteId", editingNoteId);

    try {
      const method = editingNoteId ? "PUT" : "POST";
      const res = await fetch("/api/notes/video", { method, body: formData, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (editingNoteId) {
          setNotes(notes.map(n => n._id === editingNoteId ? data.note : n));
          showToast("update", "Video note updated");
        } else {
          setNotes([...data.notes, ...notes]);
          showToast("create", `${data.notes.length} video(s) uploaded`);
        }
        closeModal();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/notes/video?noteId=${deleteId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setNotes(notes.filter(n => n._id !== deleteId));
        setDeleteId(null);
        setDeleteModalOpen(false);
        showToast("delete", "Video note deleted");
      }
    } catch (err) {
      console.error(err);
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

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
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
        {editingNoteId ? "Edit Video" : "Upload Videos"}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map(note => (
          <div key={note._id} className="bg-white p-3 rounded-lg shadow relative">
            <video controls src={note.videoUrl} className="w-full rounded mb-2" />
            <h2 className="font-semibold text-green-800">{note.title}</h2>
            <p className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()}</p>

            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={() => openEdit(note)}
                className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                title="Edit"
              >
                <HiPencil />
              </button>
              <button
                onClick={() => openDeleteModal(note._id)}
                className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                title="Delete"
              >
                <HiTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Toast / Snackbar */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded shadow-lg text-white z-50 ${
            toast.type === "create" ? "bg-green-600" :
            toast.type === "update" ? "bg-blue-600" :
            "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Create / Edit Modal */}
     {modalOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
    <div className="bg-white p-6 rounded-lg w-full max-w-md relative text-black shadow-2xl">
      <button onClick={closeModal} className="absolute top-3 right-3 text-black hover:text-gray-700">
        <HiX size={24} />
      </button>

      <h3 className="font-bold mb-3">{editingNoteId ? "Edit Video Note" : "New Video Note"}</h3>

      <input
        type="text"
        placeholder="Title"
        className={`w-full p-2 mb-2 border rounded ${errors.title ? "border-red-500" : "border-gray-300"}`}
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      {errors.title && <p className="text-red-600 text-sm mb-2">{errors.title}</p>}

      {!editingNoteId && (
        <>
          <div className="relative mb-4">
            <HiOutlineVideoCamera className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={e => setFiles(Array.from(e.target.files || []))}
              className={`w-full pl-8 border p-2 rounded ${errors.files ? "border-red-500" : "border-gray-300"}`}
            />
          </div>
          {errors.files && <p className="text-red-600 text-sm mb-2">{errors.files}</p>}
        </>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-1 gap-2 mb-4">
          {files.map((file, i) => (
            <p key={i} className="text-sm text-gray-700">{file.name}</p>
          ))}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={actionLoading}
        className={`w-full py-2 rounded text-white ${
          editingNoteId ? "bg-blue-600 hover:bg-blue-700" : "bg-green-700 hover:bg-green-800"
        } flex justify-center items-center gap-2`}
      >
        {actionLoading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
        {editingNoteId ? "Save Changes" : "Upload"}
      </button>
    </div>
  </div>
)}


      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm relative text-black shadow-2xl">
            <h3 className="font-bold mb-4">Confirm Delete</h3>
            <p className="mb-4">Are you sure you want to delete this video note? This action cannot be undone.</p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded border"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 flex justify-center items-center gap-2"
              >
                {actionLoading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
