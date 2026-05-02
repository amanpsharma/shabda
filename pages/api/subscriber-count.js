import connectDB from "../../lib/db";
import EmailSubscriber from "../../models/EmailSubscriber";
import PushSubscription from "../../models/PushSubscription";

let cache = null;
let cacheAt = 0;
const CACHE_TTL = 5 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (cache && Date.now() - cacheAt < CACHE_TTL) {
    return res.status(200).json(cache);
  }

  await connectDB();
  const [email, push] = await Promise.all([
    EmailSubscriber.countDocuments(),
    PushSubscription.countDocuments(),
  ]);

  cache = { email, push, total: email + push };
  cacheAt = Date.now();
  return res.status(200).json(cache);
}
