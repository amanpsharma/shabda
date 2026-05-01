import crypto from "crypto";

// In-memory rate limiter: max 5 attempts per IP per 15 minutes
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = attempts.get(ip) || { count: 0, reset: now + WINDOW_MS };
  if (now > entry.reset) { attempts.set(ip, { count: 1, reset: now + WINDOW_MS }); return false; }
  if (entry.count >= MAX) return true;
  attempts.set(ip, { ...entry, count: entry.count + 1 });
  return false;
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ message: "Too many attempts. Try again in 15 minutes." });
  }

  const { password } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Wrong password" });
  }

  const token = crypto
    .createHmac("sha256", process.env.ADMIN_SECRET || "shabda-secret")
    .update(password + Math.floor(Date.now() / 86400000))
    .digest("hex");

  // Reset attempt counter on success
  attempts.delete(ip);
  return res.status(200).json({ token });
}
