import connectDB from "../../lib/db";
import EmailSubscriber from "../../models/EmailSubscriber";
import { rateLimit, getIp } from "../../lib/rateLimit";

// Stricter email regex requiring a proper TLD (2+ chars)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const checkLimit = rateLimit({ key: "subscribe-email", windowMs: 60 * 60 * 1000, max: 5 });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (checkLimit(getIp(req))) {
    return res.status(429).json({ message: "Too many requests. Try again later." });
  }

  const { email } = req.body || {};
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  await connectDB();
  try {
    await EmailSubscriber.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { email: email.trim().toLowerCase() },
      { upsert: true, new: true }
    );
    return res.status(201).json({ message: "Subscribed" });
  } catch {
    return res.status(500).json({ message: "Could not subscribe. Please try again." });
  }
}
