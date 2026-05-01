const stores = new Map();

export function rateLimit({ key, windowMs = 15 * 60 * 1000, max = 10 }) {
  if (!stores.has(key)) stores.set(key, new Map());
  const store = stores.get(key);

  return function check(ip) {
    const now = Date.now();
    const entry = store.get(ip) || { count: 0, reset: now + windowMs };
    if (now > entry.reset) {
      store.set(ip, { count: 1, reset: now + windowMs });
      return false;
    }
    if (entry.count >= max) return true;
    store.set(ip, { ...entry, count: entry.count + 1 });
    return false;
  };
}

export function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}
