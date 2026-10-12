import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

let cachedSecret = "";

// Signing secret for login tokens. Uses SESSION_SECRET when the owner sets it,
// otherwise creates a random one once and keeps it in the store.
export async function secret(store) {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (cachedSecret) return cachedSecret;
  await store.set("config/secret", { value: randomBytes(32).toString("hex") }, { onlyIfNew: true });
  cachedSecret = (await store.get("config/secret"))?.value || "";
  if (!cachedSecret) throw new Error("Login is not ready yet. Try again in a minute.");
  return cachedSecret;
}

const b64 = (value) => Buffer.from(value).toString("base64url");

export function sign(payload, key) {
  const body = b64(JSON.stringify(payload));
  const mac = createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verify(token, key) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const expected = createHmac("sha256", key).update(body).digest("base64url");
  const a = Buffer.from(mac || "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function checkPassword(password, salt, hash) {
  const candidate = Buffer.from(scryptSync(password, salt, 64).toString("hex"));
  const stored = Buffer.from(hash || "");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

export function sameSecret(given, expected) {
  if (!expected) return false;
  const a = createHash("sha256").update(String(given || "")).digest();
  const b = createHash("sha256").update(String(expected)).digest();
  return timingSafeEqual(a, b);
}

export function randomCode(length) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}
