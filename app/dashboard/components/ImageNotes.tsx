"use client";

import { useEffect, useState } from "react";
import { HiOutlinePhotograph, HiX } from "react-icons/hi";
import { useToast } from "@/app/(providers)/ToastProvider"; // import global toast

type ImageNote = {
  _id: string;
  title: string;
  imageUrls: string[];
  createdAt: string;
};

export default function ImageNotes() {
  const { showToast: globalShowToast } = useToast(); // global toast hook

  const [notes, setNotes] = useState<ImageNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  // Loading states
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    message: string;
    type: "create" | "update" | "delete" | "error";
  } | null>(null);

  // Input validation errors
  const [errors, setErrors] = useState<{ title?: string; files?: string }>({});

  // Image preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const showSnackbar = (
    message: string,
    type: "create" | "update" | "delete" | "error" = "create"
  ) => {
    setSnackbar({ message, type });
    setTimeout(() => setSnackbar(null), 3000);

    // Trigger global toast as well
    globalShowToast(message, type);
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes/image", { credentials: "include" });
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
    const newErrors: { title?: string; files?: string } = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (files.length === 0) newErrors.files = "At least one image is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaveLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    files.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch("/api/notes/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setNotes([data.note, ...notes]);
        showSnackbar("Note created successfully", "create");
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

    const newErrors: { title?: string } = {};
    if (!title.trim()) newErrors.title = "Title is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaveLoading(true);
    const formData = new FormData();
    formData.append("noteId", editingNoteId);
    formData.append("title", title);
    files.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch("/api/notes/image", {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setNotes(notes.map((n) => (n._id === data.note._id ? data.note : n)));
        showSnackbar("Note updated successfully", "update");
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
      const res = await fetch(`/api/notes/image?noteId=${deletingNoteId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setNotes(notes.filter((n) => n._id !== deletingNoteId));
        showSnackbar("Note deleted successfully", "delete");
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

  const openEdit = (note: ImageNote) => {
    setEditingNoteId(note._id);
    setTitle(note.title);
    setFiles([]);
    setErrors({});
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
    setErrors({});
  };

  const openPreview = (url: string) => {
    setPreviewImage(url);
    setPreviewModalOpen(true);
  };

  const closePreview = () => {
    setPreviewModalOpen(false);
    setPreviewImage(null);
  };

  if (loading) return <p className="p-6 text-center">Loading...</p>;

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
        Upload Images
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {notes.map((note) => (
          <div key={note._id} className="bg-white p-3 rounded-lg shadow relative">
            <div className="grid grid-cols-2 gap-2 mb-2">
              {note.imageUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={note.title}
                  className="h-32 w-full object-cover rounded cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => openPreview(url)}
                />
              ))}
            </div>

            <h2 className="font-semibold text-green-800">{note.title}</h2>
            <p className="text-xs text-gray-500 mb-2">
              {new Date(note.createdAt).toLocaleString()}
            </p>

            <div className="flex gap-2">
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

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative text-black">
            <button onClick={closeModal} className="absolute top-3 right-3">
              <HiX size={24} />
            </button>

            <h3 className="font-bold mb-3">{editingNoteId ? "Edit Image Note" : "New Image Note"}</h3>

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

            <div className="mb-4">
              <label
                htmlFor="fileUpload"
                className={`flex items-center justify-center gap-2 cursor-pointer border border-dashed rounded-lg p-4 text-gray-600 hover:bg-gray-100 transition ${
                  errors.files ? "border-red-500" : "border-gray-400"
                }`}
              >
                <HiOutlinePhotograph size={24} />
                {files.length > 0
                  ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
                  : "Click to select images"}
              </label>
              <input
                type="file"
                id="fileUpload"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="hidden"
              />
              {errors.files && <p className="text-red-600 text-sm mt-1">{errors.files}</p>}
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {files.map((file, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt={`preview-${index}`}
                    className="h-24 w-full object-cover rounded"
                  />
                ))}
              </div>
            )}

            <button
              onClick={editingNoteId ? handleUpdate : handleCreate}
              disabled={saveLoading}
              className={`w-full px-4 py-2 rounded text-white ${
                editingNoteId ? "bg-blue-600" : "bg-green-700"
              } flex items-center justify-center gap-2`}
            >
              {saveLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : editingNoteId ? "Update" : "Upload"}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
              Are you sure you want to delete this note?
            </p>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="w-full py-2 bg-red-600 text-white rounded"
            >
              {deleteLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto block"></span>
              ) : (
                "Confirm Delete"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewModalOpen && previewImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="relative max-w-3xl w-full">
            <button
              className="absolute top-3 right-3 text-black"
              onClick={closePreview}
            >
              <HiX size={28} />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] rounded-lg shadow-lg object-contain"
            />
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg text-white z-50 text-sm sm:text-base max-w-[90%] sm:max-w-md text-center
          ${
            snackbar.type === "create"
              ? "bg-green-600"
              : snackbar.type === "update"
              ? "bg-blue-600"
              : snackbar.type === "delete"
              ? "bg-red-600"
              : "bg-sky-500"
          } animate-slide-in`}
        >
          {snackbar.message}
        </div>
      )}
    </div>
  );
}
