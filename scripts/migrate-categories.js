import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONGO_URI =
  "mongodb+srv://14mcaaman_db_user:SvquFEGH8yYPM03a@shabda-cluster.stdpcrl.mongodb.net/shabda";

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const words = JSON.parse(
    readFileSync(join(__dirname, "../data/words.json"), "utf-8")
  );

  const db = mongoose.connection.db;
  const col = db.collection("words");

  let updated = 0;
  let notFound = 0;

  for (const w of words) {
    const result = await col.updateOne(
      { "en.word": w.en.word },
      {
        $set: {
          category: w.category || null,
          synonyms: w.synonyms || [],
          antonyms: w.antonyms || [],
          etymology: w.etymology || "",
          mnemonic: w.mnemonic || "",
          didYouKnow: w.didYouKnow || "",
          difficulty: w.difficulty || "intermediate",
        },
      }
    );
    if (result.matchedCount > 0) {
      updated++;
    } else {
      notFound++;
      console.warn(`  NOT FOUND: ${w.en.word}`);
    }
  }

  console.log(`Updated ${updated} words`);
  if (notFound > 0) console.warn(`${notFound} words not found in DB`);

  // Print category counts after migration
  const counts = await col.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();
  console.log("\nCategory counts after migration:");
  for (const c of counts) console.log(`  ${c._id ?? "null"} : ${c.count}`);

  await mongoose.disconnect();
  console.log("\nDone.");
}

migrate().catch((err) => { console.error(err); process.exit(1); });
