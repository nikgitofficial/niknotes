import { Schema, model, models } from "mongoose";

const ImageNoteSchema = new Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export default models.ImageNote || model("ImageNote", ImageNoteSchema);
