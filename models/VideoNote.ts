import { Schema, model, models } from "mongoose";

const VideoNoteSchema = new Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    videoUrls: [{ type: String, required: true }],
    videoSizes: [{ type: Number }], // Array of file sizes in bytes
  },
  { timestamps: true }
);

export default models.VideoNote || model("VideoNote", VideoNoteSchema);