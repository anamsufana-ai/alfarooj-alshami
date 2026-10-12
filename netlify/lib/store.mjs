import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getStore } from "@netlify/blobs";

// Orders, customers and bookings are kept in Netlify Blobs (built into every
// Netlify site, nothing to set up). Deploy previews get their own store so a
// test order on a preview never lands in the real sales report.
// For local testing, set VC_LOCAL_STORE to a folder and data is kept on disk.

function fileStore(dir) {
  const path = (key) => join(dir, encodeURIComponent(key));
  return {
    async get(key) {
      try {
        return JSON.parse(await readFile(path(key), "utf8"));
      } catch {
        return null;
      }
    },
    async set(key, value, { onlyIfNew = false } = {}) {
      await mkdir(dir, { recursive: true });
      if (onlyIfNew && (await this.get(key)) !== null) return { modified: false };
      await writeFile(path(key), JSON.stringify(value));
      return { modified: true };
    },
    async list(prefix) {
      await mkdir(dir, { recursive: true });
      return (await readdir(dir)).map(decodeURIComponent).filter((key) => key.startsWith(prefix)).sort();
    },
    async delete(key) {
      await rm(path(key), { force: true });
    },
  };
}

function blobStore(name) {
  const store = getStore({ name, consistency: "strong" });
  return {
    get: (key) => store.get(key, { type: "json" }),
    async set(key, value, { onlyIfNew = false } = {}) {
      const result = await store.setJSON(key, value, onlyIfNew ? { onlyIfNew: true } : undefined);
      return { modified: result?.modified !== false };
    },
    async list(prefix) {
      const { blobs } = await store.list({ prefix });
      return blobs.map((blob) => blob.key).sort();
    },
    delete: (key) => store.delete(key),
  };
}

export function openStore(context) {
  if (process.env.VC_LOCAL_STORE) return fileStore(process.env.VC_LOCAL_STORE);
  const deployContext = context?.deploy?.context || "production";
  return blobStore(deployContext === "production" ? "alfarooj-data" : "alfarooj-preview");
}

// Fetch many keys with a small concurrency limit.
export async function getMany(store, keys, limit = 24) {
  const out = new Array(keys.length);
  let next = 0;
  async function worker() {
    while (next < keys.length) {
      const index = next;
      next += 1;
      out[index] = await store.get(keys[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, keys.length) }, worker));
  return out.filter(Boolean);
}
