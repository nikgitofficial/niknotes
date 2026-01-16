import mongoose, { Schema, model, models } from "mongoose";

const NoteSchema = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default models.Note || model("Note", NoteSchema);
