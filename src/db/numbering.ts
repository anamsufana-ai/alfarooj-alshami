import { sql } from "drizzle-orm";
import { rows, type Database } from "./client";

export async function allocateNumber(db: Database, name: "order" | "invoice"): Promise<number> {
  const result = await db.execute(sql`
    UPDATE number_counters
    SET last_value = last_value + 1
    WHERE name = ${name}
    RETURNING last_value
  `);
  const row = (await rows<{ last_value: number | string }>(result))[0];
  if (!row) throw new Error(`Missing number counter: ${name}`);
  return Number(row.last_value);
}
