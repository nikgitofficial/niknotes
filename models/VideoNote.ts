import { Schema, model, models } from "mongoose";

const VideoNoteSchema = new Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export default models.VideoNote || model("VideoNote", VideoNoteSchema);
