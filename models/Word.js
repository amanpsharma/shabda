import mongoose from "mongoose";

const wordSchema = new mongoose.Schema(
  {
    en: {
      word: { type: String, required: true },
      phonetic: { type: String, required: true },
      pos: { type: String, required: true },
    },
    hi: {
      word: { type: String, required: true },
      romanized: { type: String, required: true },
      pos: { type: String, required: true },
    },
    meaningEn: { type: String, required: true },
    meaningHi: { type: String, required: true },
    exampleEn: { type: String, required: true },
    exampleHi: { type: String, required: true },
    order: { type: Number, default: 0 },
    category: { type: String, enum: ["noun", "verb", "adjective", "phrase"], default: "adjective" },
    synonyms: { type: [String], default: [] },
    antonyms: { type: [String], default: [] },
    etymology: { type: String, default: "" },
    mnemonic: { type: String, default: "" },
    didYouKnow: { type: String, default: "" },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "intermediate" },
  },
  { timestamps: true }
);

wordSchema.index({ "en.word": 1 }, { unique: true });

export default mongoose.models.Word || mongoose.model("Word", wordSchema);
