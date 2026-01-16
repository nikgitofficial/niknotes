import mongoose from "mongoose";

const FileNoteSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // add this
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const FileNote = mongoose.models.FileNote || mongoose.model("FileNote", FileNoteSchema);
export default FileNote;
