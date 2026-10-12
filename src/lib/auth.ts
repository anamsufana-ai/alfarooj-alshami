import "server-only";

import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb, rows, type Database } from "@/db/client";
import type { Actor, Role } from "@/domain/permissions";

const COOKIE = "fas_session";
const SESSION_DAYS = 14;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Buffer.from(digest).toString("hex");
}

export async function createSession(db: Database, userId: string): Promise<string> {
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  const tokenHash = await sha256(token);
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.execute(sql`
    INSERT INTO sessions (id, user_id, token_hash, expires_at)
    VALUES (${crypto.randomUUID()}, ${userId}, ${tokenHash}, ${expires})
  `);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return token;
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.execute(sql`DELETE FROM sessions WHERE token_hash = ${await sha256(token)}`);
  }
  jar.delete(COOKIE);
}

export async function getActor(): Promise<Actor | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const found = await rows<{
    id: string;
    role: Role;
    disabled_at: string | null;
    branch_id: string | null;
  }>(await db.execute(sql`
    SELECT users.id, users.role, users.disabled_at, user_branches.branch_id
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    LEFT JOIN user_branches ON user_branches.user_id = users.id
    WHERE sessions.token_hash = ${await sha256(token)}
      AND sessions.expires_at > now()
  `));
  if (found.length === 0) return null;
  return {
    id: found[0].id,
    role: found[0].role,
    disabled: Boolean(found[0].disabled_at),
    branchIds: found.flatMap((row) => (row.branch_id ? [row.branch_id] : [])),
  };
}

export async function hashSecret(value: string): Promise<string> {
  return sha256(value);
}
