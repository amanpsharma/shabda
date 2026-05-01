import webpush from "web-push";
import connectDB from "../../lib/db";
import PushSubscription from "../../models/PushSubscription";
import { verifyAdminToken } from "../../lib/adminAuth";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:admin@shabda.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!verifyAdminToken(req)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { title = "Shabda", body = "Your daily word is ready." } = req.body || {};

  await connectDB();
  const subs = await PushSubscription.find().lean();

  const payload = JSON.stringify({ title, body });
  let sent = 0, failed = 0;

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: s.keys },
          payload
        );
        sent++;
      } catch (err) {
        if (err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: s._id });
        }
        failed++;
      }
    })
  );

  return res.status(200).json({ sent, failed, total: subs.length });
}
