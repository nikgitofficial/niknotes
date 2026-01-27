"use client";

import { useEffect, useState } from "react";
import { HiOutlinePaperClip, HiX, HiPencil, HiTrash, HiDownload, HiEye } from "react-icons/hi";

type FileNoteType = {
  _id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
};

type ToastType = "create" | "update" | "delete" | "download";

export default function FileNotes() {
  const [notes, setNotes] = useState<FileNoteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
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

  // Toast
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

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

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const resetModal = () => {
    setModalOpen(false);
    setTitle("");
    setFiles([]);
    setEditingId(null);
    setErrors({});
  };

  const handleUploadOrUpdate = async () => {
    const newErrors: { title?: string; file?: string } = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!editingId && files.length === 0) newErrors.file = "At least one file is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaveLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    files.forEach(f => formData.append("files", f));
    if (editingId) formData.append("noteId", editingId);

    try {
      const method = editingId ? "PUT" : "POST";
      const res = await fetch("/api/notes/file", { method, body: formData, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (editingId) {
          setNotes(notes.map(n => n._id === editingId ? data.notes[0] : n));
          showToast("update", "File note updated");
        } else {
          setNotes([...data.notes, ...notes]);
          showToast("create", `${data.notes.length} file(s) uploaded`);
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
      const res = await fetch(`/api/notes/file?noteId=${deletingId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setNotes(notes.filter(n => n._id !== deletingId));
        setDeleteOpen(false);
        setDeletingId(null);
        showToast("delete", "File note deleted");
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
    setFiles([]);
    setErrors({});
    setModalOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const handleDownload = (url: string) => showToast("download", "File downloaded");

  if (loading) return <p className="p-4 sm:p-6">Loading...</p>;

  return (
    <div className="p-4 sm:p-6 relative">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 sm:mb-4 flex items-center gap-2">
          <HiOutlinePaperClip className="text-2xl sm:text-3xl" /> 
          <span>File Notes</span>
        </h1>

        <button
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded hover:bg-green-800 transition-colors text-sm sm:text-base font-medium"
        >
          {editingId ? "Edit File" : "Upload File"}
        </button>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <HiOutlinePaperClip className="mx-auto text-6xl mb-3 opacity-30" />
          <p className="text-sm sm:text-base">No file notes yet. Upload your first file!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {notes.map(note => (
            <div key={note._id} className="bg-white p-4 sm:p-5 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col">
              <span
                className="text-green-800 font-semibold underline cursor-pointer text-sm sm:text-base break-words hover:text-green-900"
                onClick={() => { setPreviewUrl(note.fileUrl); setPreviewOpen(true); }}
              >
                {note.title}
              </span>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                {new Date(note.createdAt).toLocaleString()}
              </p>

              {/* Action Buttons */}
              <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
                <button 
                  onClick={() => openEdit(note)} 
                  className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm transition-colors"
                >
                  <HiPencil className="text-base sm:text-lg" /> 
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button 
                  onClick={() => openDelete(note._id)} 
                  className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm transition-colors"
                >
                  <HiTrash className="text-base sm:text-lg" /> 
                  <span className="hidden sm:inline">Delete</span>
                </button>
                <a 
                  href={note.fileUrl} 
                  download 
                  onClick={() => handleDownload(note.fileUrl)}
                  className="flex items-center gap-1 text-sky-600 hover:bg-sky-50 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm transition-colors"
                >
                  <HiDownload className="text-base sm:text-lg" /> 
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button 
                  onClick={() => { setPreviewUrl(note.fileUrl); setPreviewOpen(true); }}
                  className="flex items-center gap-1 text-gray-700 hover:bg-gray-100 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm transition-colors"
                >
                  <HiEye className="text-base sm:text-lg" /> 
                  <span className="hidden sm:inline">Preview</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

     {/* Toast */}
{toast && (
  <div className={`fixed top-4 sm:top-6 left-1/2 -translate-x-1/2
    px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg text-white z-50 text-sm sm:text-base max-w-[90%] sm:max-w-md text-center
    ${
      toast.type === "create" ? "bg-green-600" :
      toast.type === "update" ? "bg-blue-600" :
      toast.type === "delete" ? "bg-red-600" :
      "bg-sky-500"
    }`}
  >
    {toast.message}
  </div>
)}


      {/* Upload/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md relative text-black max-h-[90vh] overflow-y-auto">
            <button 
              onClick={resetModal} 
              className="absolute top-3 right-3 text-black hover:text-gray-700 z-10"
            >
              <HiX size={24} />
            </button>
            <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 pr-8">
              {editingId ? "Edit File Note" : "Upload File"}
            </h3>

            <input
              type="text"
              placeholder="Title"
              className={`w-full p-2 sm:p-3 mb-2 border rounded text-sm sm:text-base ${errors.title ? "border-red-500" : "border-gray-300"}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className="text-red-600 text-xs sm:text-sm mb-2">{errors.title}</p>}

            {!editingId && (
              <>
                <div className="relative mb-3 sm:mb-4">
                  <HiOutlinePaperClip className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className={`w-full pl-8 sm:pl-10 border p-2 sm:p-3 rounded text-sm sm:text-base ${errors.file ? "border-red-500" : "border-gray-300"}`}
                  />
                </div>
                {files.length > 0 && (
                  <p className="text-gray-700 text-xs sm:text-sm mb-2 bg-gray-50 p-2 rounded">
                    {files.length} file(s) selected
                  </p>
                )}
                {errors.file && <p className="text-red-600 text-xs sm:text-sm mb-2">{errors.file}</p>}
              </>
            )}

            <button
              onClick={handleUploadOrUpdate}
              disabled={saveLoading}
              className="bg-green-700 text-white px-4 py-2 sm:py-3 rounded w-full flex justify-center items-center gap-2 hover:bg-green-800 transition-colors disabled:opacity-50 text-sm sm:text-base font-medium"
            >
              {saveLoading && <span className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              {editingId ? "Update" : "Upload"}
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl p-3 sm:p-4 relative shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
            <button 
              onClick={() => setPreviewOpen(false)} 
              className="absolute top-2 sm:top-3 right-2 sm:right-3 text-black hover:text-gray-700 bg-white rounded-full p-1 z-10 shadow-md"
            >
              <HiX size={24} className="sm:w-7 sm:h-7" />
            </button>
            <div className="flex-1 overflow-auto mt-8 sm:mt-10">
              {previewUrl.endsWith(".pdf") ? (
                <iframe 
                  src={previewUrl} 
                  className="w-full h-[70vh] sm:h-[80vh] rounded" 
                  title="File Preview" 
                />
              ) : (
                <img 
                  src={previewUrl} 
                  alt="File Preview" 
                  className="w-full h-auto max-h-[70vh] sm:max-h-[80vh] rounded object-contain mx-auto" 
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-5 sm:p-6 rounded-lg w-full max-w-sm relative shadow-2xl flex flex-col items-center">
            <HiX 
              size={24} 
              className="absolute top-3 right-3 cursor-pointer text-black hover:text-gray-700" 
              onClick={() => setDeleteOpen(false)} 
            />
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <HiTrash className="text-red-600 text-2xl sm:text-3xl" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl mb-2 text-center text-black">Confirm Delete</h3>
            <p className="text-gray-600 text-center mb-5 sm:mb-6 text-sm sm:text-base">
              Are you sure you want to delete this file note? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 py-2 sm:py-2.5 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2 sm:py-2.5 bg-red-600 text-white rounded hover:bg-red-700 flex justify-center items-center gap-2 transition-colors disabled:opacity-50 text-sm sm:text-base font-medium"
              >
                {deleteLoading && <span className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}