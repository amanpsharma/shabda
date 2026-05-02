import connectDB from "../../../lib/db";
import ExampleSubmission from "../../../models/ExampleSubmission";
import { rateLimit, getIp } from "../../../lib/rateLimit";

const checkLimit = rateLimit({ key: "examples", windowMs: 60 * 60 * 1000, max: 5 });

export default async function handler(req, res) {
  if (req.method === "POST") {
    if (checkLimit(getIp(req))) {
      return res.status(429).json({ message: "Too many submissions. Try again later." });
    }

    const { wordId, wordEn, text, lang } = req.body || {};
    if (!wordId || !wordEn || !text?.trim()) {
      return res.status(400).json({ message: "wordId, wordEn, and text are required" });
    }
    if (text.length > 280) {
      return res.status(400).json({ message: "Example must be 280 characters or fewer" });
    }

    await connectDB();
    try {
      await ExampleSubmission.create({
        wordId: String(wordId),
        wordEn: String(wordEn).trim().slice(0, 80),
        text: text.trim(),
        lang: lang === "hi" ? "hi" : "en",
      });
      return res.status(201).json({ message: "Submitted — thank you!" });
    } catch {
      return res.status(500).json({ message: "Could not save submission" });
    }
  }

  res.setHeader("Allow", ["POST"]);
  res.status(405).json({ message: "Method not allowed" });
}
