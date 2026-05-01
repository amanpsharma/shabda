import mongoose from "mongoose";
import connectDB from "../../../lib/db";
import Word from "../../../models/Word";
import { verifyAdminToken } from "../../../lib/adminAuth";
import { invalidateCache } from "../../../lib/getWordData";

export default async function handler(req, res) {
  await connectDB();
  const { id } = req.query;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid word ID" });
  }

  if (req.method === "GET") {
    const word = await Word.findById(id).catch(() => null);
    if (!word) return res.status(404).json({ message: "Word not found" });
    return res.status(200).json(word);
  }

  if (req.method === "PUT") {
    if (!verifyAdminToken(req)) return res.status(401).json({ message: "Unauthorized" });
    try {
      const word = await Word.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
      if (!word) return res.status(404).json({ message: "Word not found" });
      invalidateCache();
      return res.status(200).json(word);
    } catch {
      return res.status(400).json({ message: "Could not update word" });
    }
  }

  if (req.method === "DELETE") {
    if (!verifyAdminToken(req)) return res.status(401).json({ message: "Unauthorized" });
    const word = await Word.findByIdAndDelete(id).catch(() => null);
    if (!word) return res.status(404).json({ message: "Word not found" });
    invalidateCache();
    return res.status(200).json({ message: "Word deleted" });
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  res.status(405).json({ message: `Method ${req.method} not allowed` });
}
