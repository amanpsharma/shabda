import connectDB from "../../../lib/db";
import Word from "../../../models/Word";
import { verifyAdminToken } from "../../../lib/adminAuth";
import { invalidateCache } from "../../../lib/getWordData";

const VALID_CATS = ["noun", "verb", "adjective", "phrase"];

function validateWordBody(body) {
  const { en, hi, meaningEn, meaningHi, exampleEn, exampleHi, category } = body || {};
  if (!en?.word?.trim()) return "en.word is required";
  if (!en?.phonetic?.trim()) return "en.phonetic is required";
  if (!en?.pos?.trim()) return "en.pos is required";
  if (!hi?.word?.trim()) return "hi.word is required";
  if (!hi?.romanized?.trim()) return "hi.romanized is required";
  if (!hi?.pos?.trim()) return "hi.pos is required";
  if (!meaningEn?.trim()) return "meaningEn is required";
  if (!meaningHi?.trim()) return "meaningHi is required";
  if (!exampleEn?.trim()) return "exampleEn is required";
  if (!exampleHi?.trim()) return "exampleHi is required";
  if (category && !VALID_CATS.includes(category)) return `category must be one of: ${VALID_CATS.join(", ")}`;
  return null;
}

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "GET") {
    const words = await Word.find().sort({ order: 1, createdAt: 1 });
    return res.status(200).json(words);
  }

  if (req.method === "POST") {
    if (!verifyAdminToken(req)) return res.status(401).json({ message: "Unauthorized" });
    const validationError = validateWordBody(req.body);
    if (validationError) return res.status(400).json({ message: validationError });
    try {
      const word = await Word.create(req.body);
      invalidateCache();
      return res.status(201).json(word);
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: "Word already exists" });
      return res.status(400).json({ message: "Could not create word" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).json({ message: `Method ${req.method} not allowed` });
}
