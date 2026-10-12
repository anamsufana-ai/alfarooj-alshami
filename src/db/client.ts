import "server-only";

import { PGlite } from "@electric-sql/pglite";
import { sql, type SQL } from "drizzle-orm";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { MIGRATION_ID, MIGRATION_SQL } from "./migration-sql";

export interface Database {
  execute: (query: SQL) => Promise<unknown>;
  transaction: <T>(run: (tx: Database) => Promise<T>) => Promise<T>;
}

type Handle = Database & { close: () => Promise<void> };

function statements(script: string): string[] {
  return script
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

export async function rows<T>(result: unknown): Promise<T[]> {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result && Array.isArray(result.rows)) {
    return result.rows as T[];
  }
  return [];
}

type Queryable = {
  execute: (query: SQL) => Promise<unknown>;
  transaction: (run: (tx: Queryable) => Promise<unknown>) => Promise<unknown>;
};

function wrap(source: Queryable, close: () => Promise<void>): Handle {
  return {
    execute: (query) => source.execute(query),
    transaction: ((run) => source.transaction(async (tx) => run(wrap(tx, async () => undefined)))) as Handle["transaction"],
    close,
  };
}

export async function migrate(db: Database): Promise<void> {
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`));
  const existing = await rows<{ id: string }>(
    await db.execute(sql`SELECT id FROM schema_migrations WHERE id = ${MIGRATION_ID}`),
  );
  if (existing.length > 0) return;
  await db.transaction(async (tx) => {
    for (const statement of statements(MIGRATION_SQL)) {
      await tx.execute(sql.raw(statement));
    }
    await tx.execute(sql`INSERT INTO schema_migrations (id) VALUES (${MIGRATION_ID})`);
  });
}

export async function openMemoryDatabase(): Promise<Handle> {
  const client = new PGlite();
  const db = wrap(drizzlePglite(client) as unknown as Queryable, async () => {
    await client.close();
  });
  await migrate(db);
  return db;
}

async function openEmbeddedDatabase(): Promise<Handle> {
  const directory = path.join(process.cwd(), ".data", "pglite");
  fs.mkdirSync(directory, { recursive: true });
  const client = new PGlite(directory);
  return wrap(drizzlePglite(client) as unknown as Queryable, async () => {
    await client.close();
  });
}

function openPostgresDatabase(url: string): Handle {
  const client = postgres(url, { prepare: false, max: 1 });
  return wrap(drizzlePostgres(client) as unknown as Queryable, () => client.end());
}

export function databaseMode(): "external" | "embedded" | "missing" {
  if (process.env.DATABASE_URL) return "external";
  if (process.env.NETLIFY || process.env.CONTEXT) return "missing";
  return "embedded";
}

const globalDatabase = globalThis as unknown as { faroujDb?: Promise<Handle> };

export async function getDb(): Promise<Handle> {
  if (!globalDatabase.faroujDb) {
    globalDatabase.faroujDb = (async () => {
      const mode = databaseMode();
      if (mode === "missing") {
        throw new Error("DATABASE_URL is required on Netlify. Embedded Postgres is only for local development.");
      }
      const db = mode === "external" ? openPostgresDatabase(process.env.DATABASE_URL as string) : await openEmbeddedDatabase();
      await migrate(db);
      const { seedIfEmpty } = await import("./seed");
      await seedIfEmpty(db);
      return db;
    })();
  }
  return globalDatabase.faroujDb;
}
