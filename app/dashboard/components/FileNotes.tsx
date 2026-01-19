"use client";

import { useEffect, useState } from "react";
import { HiOutlinePaperClip, HiX, HiPencil, HiTrash, HiDownload, HiEye } from "react-icons/hi";

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
  const [editingId, setEditingId] = useState<string | null>(null);

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Loading states
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{ title?: string; file?: string }>({});

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes/file", { credentials: "include" });
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

  const resetModal = () => {
    setModalOpen(false);
    setTitle("");
    setFile(null);
    setEditingId(null);
    setErrors({});
  };

  const handleUploadOrUpdate = async () => {
    const newErrors: { title?: string; file?: string } = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!editingId && !file) newErrors.file = "File is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaveLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    if (file) formData.append("file", file);
    if (editingId) formData.append("noteId", editingId);

    try {
      const method = editingId ? "PUT" : "POST";
      const res = await fetch("/api/notes/file", {
        method,
        body: formData,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (editingId) {
          setNotes(notes.map(n => (n._id === editingId ? data.note : n)));
        } else {
          setNotes([data.note, ...notes]);
        }
        resetModal();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/notes/file?noteId=${deletingId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setNotes(notes.filter(n => n._id !== deletingId));
        setDeleteOpen(false);
        setDeletingId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEdit = (note: FileNoteType) => {
    setEditingId(note._id);
    setTitle(note.title);
    setFile(null);
    setErrors({});
    setModalOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
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
        {editingId ? "Edit File" : "Upload File"}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map(note => (
          <div key={note._id} className="bg-white p-4 rounded-lg shadow flex flex-col relative">
            <span
              className="text-green-800 font-semibold underline cursor-pointer"
              onClick={() => {
                setPreviewUrl(note.fileUrl);
                setPreviewOpen(true);
              }}
            >
              {note.title}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(note.createdAt).toLocaleString()}
            </p>

            <div className="mt-2 flex gap-2">
              <button
                onClick={() => openEdit(note)}
                className="flex items-center gap-1 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded"
              >
                <HiPencil /> Edit
              </button>
              <button
                onClick={() => openDelete(note._id)}
                className="flex items-center gap-1 text-red-600 hover:bg-red-100 px-2 py-1 rounded"
              >
                <HiTrash /> Delete
              </button>
              <a
                href={note.fileUrl}
                download
                className="flex items-center gap-1 text-green-600 hover:bg-green-100 px-2 py-1 rounded"
              >
                <HiDownload /> Download
              </a>
              <button
                onClick={() => {
                  setPreviewUrl(note.fileUrl);
                  setPreviewOpen(true);
                }}
                className="flex items-center gap-1 text-gray-800 hover:bg-gray-100 px-2 py-1 rounded"
              >
                <HiEye /> Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative text-black">
            <button onClick={resetModal} className="absolute top-3 right-3 text-black hover:text-gray-700">
              <HiX size={24} />
            </button>
            <h3 className="font-bold mb-3">{editingId ? "Edit File Note" : "Upload File"}</h3>

            <input
              type="text"
              placeholder="Title"
              className={`w-full p-2 mb-2 border rounded ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className="text-red-600 text-sm mb-2">{errors.title}</p>}

            {!editingId && (
              <>
                <input
                  type="file"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className={`mb-4 border p-1 rounded ${errors.file ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.file && <p className="text-red-600 text-sm mb-2">{errors.file}</p>}
              </>
            )}

            <button
              onClick={handleUploadOrUpdate}
              disabled={saveLoading}
              className="bg-green-700 text-white px-4 py-2 rounded w-full flex justify-center items-center gap-2"
            >
              {saveLoading && (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {editingId ? "Update" : "Upload"}
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg w-full max-w-3xl p-4 relative shadow-2xl">
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-3 right-3 text-black hover:text-gray-700"
            >
              <HiX size={28} />
            </button>
            {previewUrl.endsWith(".pdf") ? (
              <iframe src={previewUrl} className="w-full h-[80vh] rounded" title="File Preview" />
            ) : (
              <img src={previewUrl} alt="File Preview" className="w-full h-auto max-h-[80vh] rounded" />
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm relative shadow-2xl flex flex-col items-center">
            <HiX
              size={24}
              className="absolute top-3 right-3 cursor-pointer text-black hover:text-gray-700"
              onClick={() => setDeleteOpen(false)}
            />
            <h3 className="font-bold mb-4 text-center text-black">Confirm Delete</h3>
            <p className="text-gray-700 text-center mb-6">Are you sure you want to delete this note?</p>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="relative w-full py-2 bg-red-600 text-white rounded flex justify-center items-center gap-2"
            >
              {deleteLoading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
