import connectDB from "../../lib/db";
import PushSubscription from "../../models/PushSubscription";
import { rateLimit, getIp } from "../../lib/rateLimit";

const checkLimit = rateLimit({ key: "subscribe-push", windowMs: 60 * 60 * 1000, max: 10 });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (checkLimit(getIp(req))) {
    return res.status(429).json({ message: "Too many requests. Try again later." });
  }

  const { endpoint, keys } = req.body || {};
  if (
    !endpoint || typeof endpoint !== "string" ||
    !keys?.p256dh || typeof keys.p256dh !== "string" ||
    !keys?.auth || typeof keys.auth !== "string"
  ) {
    return res.status(400).json({ message: "Invalid subscription" });
  }

  await connectDB();
  try {
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { endpoint, keys },
      { upsert: true, new: true }
    );
    return res.status(201).json({ message: "Subscribed" });
  } catch {
    return res.status(500).json({ message: "Could not save subscription. Please try again." });
  }
}
