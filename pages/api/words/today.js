import connectDB from "../../../lib/db";
import Word from "../../../models/Word";

const EPOCH = new Date("2024-01-01T00:00:00").getTime();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  await connectDB();
  const words = await Word.find().sort({ order: 1, createdAt: 1 });
  if (!words.length) return res.status(404).json({ message: "No words found" });

  const dayIndex = Math.floor((Date.now() - EPOCH) / 86400000);
  const index = dayIndex % words.length;

  res.status(200).json({ word: words[index], index, total: words.length });
}
