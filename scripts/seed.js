import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONGO_URI =
  "mongodb+srv://14mcaaman_db_user:SvquFEGH8yYPM03a@shabda-cluster.stdpcrl.mongodb.net/shabda";

const wordSchema = new mongoose.Schema(
  {
    en: { word: String, phonetic: String, pos: String },
    hi: { word: String, romanized: String, pos: String },
    meaningEn: String,
    meaningHi: String,
    exampleEn: String,
    exampleHi: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);
wordSchema.index({ "en.word": 1 }, { unique: true });
const Word = mongoose.models.Word || mongoose.model("Word", wordSchema);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const words = JSON.parse(
    readFileSync(join(__dirname, "../data/words.json"), "utf-8")
  );

  await Word.deleteMany({});
  console.log("Cleared existing words");

  await Word.insertMany(words.map((w, i) => ({ ...w, order: i })));
  console.log(`Seeded ${words.length} words`);

  await mongoose.disconnect();
  console.log("Done");
}

seed().catch((err) => { console.error(err); process.exit(1); });
