import crypto from "crypto";

export function verifyAdminToken(req) {
  const token = req.headers["x-admin-token"];
  if (!token) return false;
  const expected = crypto
    .createHmac("sha256", process.env.ADMIN_SECRET || "shabda-secret")
    .update((process.env.ADMIN_PASSWORD || "") + Math.floor(Date.now() / 86400000))
    .digest("hex");
  return token === expected;
}
