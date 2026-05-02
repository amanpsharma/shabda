import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    wordId:  { type: String, required: true },
    wordEn:  { type: String, required: true },
    text:    { type: String, required: true, maxlength: 280 },
    lang:    { type: String, enum: ["en", "hi"], default: "en" },
  },
  { timestamps: true }
);

export default mongoose.models.ExampleSubmission ||
  mongoose.model("ExampleSubmission", schema);
