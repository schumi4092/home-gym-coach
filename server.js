// Local file-backed storage server for Home Gym Coach.
// Serves the built static files in `dist/` and exposes a tiny key/value API
// at /api/kv/:key, persisted to data/workout.json.

import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import url from "node:url";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const STATIC_ROOT = path.join(ROOT, "dist");
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "workout.json");
const DEFAULT_PORT = Number(process.env.PORT ?? 8765);
const HOST = "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

// ── KV store: a single JSON file holding { key: stringValue } ────────────────
let writeQueue = Promise.resolve();
let cache = null;

async function loadStore() {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    cache = JSON.parse(raw);
    if (!cache || typeof cache !== "object") cache = {};
  } catch (err) {
    if (err.code !== "ENOENT") console.warn("Could not read", DATA_FILE, err.message);
    cache = {};
  }
  return cache;
}

async function persistStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(cache, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

function queueWrite() {
  writeQueue = writeQueue.then(persistStore).catch((err) => console.error("Failed to persist store:", err));
  return writeQueue;
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────
function send(res, status, body, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body ?? "", "utf8");
  res.writeHead(status, {
    "content-length": buf.length,
    "cache-control": "no-store",
    ...headers,
  });
  res.end(buf);
}

function sendJson(res, status, value) {
  send(res, status, JSON.stringify(value), { "content-type": "application/json; charset=utf-8" });
}

async function readBody(req, limit = 5 * 1024 * 1024) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > limit) throw new Error("payload too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

// ── Routes ───────────────────────────────────────────────────────────────────
async function handleApi(req, res, pathname) {
  if (pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, { ok: true, store: "file", file: path.relative(ROOT, DATA_FILE) });
    return;
  }

  // /api/kv/:key
  const kvMatch = pathname.match(/^\/api\/kv\/(.+)$/);
  if (kvMatch) {
    const key = decodeURIComponent(kvMatch[1]);
    const store = await loadStore();

    if (req.method === "GET") {
      if (!(key in store)) { send(res, 404, "Not Found"); return; }
      send(res, 200, store[key], { "content-type": "text/plain; charset=utf-8" });
      return;
    }

    if (req.method === "PUT") {
      const body = await readBody(req);
      store[key] = body;
      await queueWrite();
      send(res, 204, "");
      return;
    }

    if (req.method === "DELETE") {
      if (key in store) {
        delete store[key];
        await queueWrite();
      }
      send(res, 204, "");
      return;
    }

    res.writeHead(405, { allow: "GET, PUT, DELETE" });
    res.end();
    return;
  }

  // Bulk dump for backups / debugging
  if (pathname === "/api/dump" && req.method === "GET") {
    const store = await loadStore();
    sendJson(res, 200, store);
    return;
  }

  send(res, 404, "Not Found");
}

async function handleStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { allow: "GET, HEAD" });
    res.end();
    return;
  }

  const cleaned = pathname.replace(/^\/+/, "");
  const target = cleaned ? path.normalize(path.join(STATIC_ROOT, cleaned)) : path.join(STATIC_ROOT, "index.html");

  if (!target.startsWith(STATIC_ROOT)) { send(res, 403, "Forbidden"); return; }

  let filePath = target;
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
  } catch {
    // SPA fallback so client-side routes still resolve
    filePath = path.join(STATIC_ROOT, "index.html");
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, { "content-type": MIME[ext] ?? "application/octet-stream" });
  } catch (err) {
    if (err.code === "ENOENT") send(res, 404, "Not Found");
    else { console.error(err); send(res, 500, "Internal Server Error"); }
  }
}

// ── Server ───────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  try {
    const parsed = url.parse(req.url ?? "/");
    const pathname = parsed.pathname ?? "/";

    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname);
    } else {
      await handleStatic(req, res, pathname);
    }
  } catch (err) {
    console.error("Request error:", err);
    if (!res.headersSent) send(res, 500, "Internal Server Error");
  }
});

async function tryListen(port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => { server.off("listening", onListening); reject(err); };
    const onListening = () => { server.off("error", onError); resolve(port); };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, HOST);
  });
}

(async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await loadStore();

  let port = DEFAULT_PORT;
  for (;;) {
    try {
      await tryListen(port);
      break;
    } catch (err) {
      if (err.code === "EADDRINUSE" && port < DEFAULT_PORT + 20) {
        port += 1;
        continue;
      }
      console.error("Failed to start server:", err);
      process.exit(1);
    }
  }

  const urlString = `http://${HOST}:${port}/`;
  console.log(`Home Gym Coach is running at ${urlString}`);
  console.log(`Data file: ${DATA_FILE}`);
  console.log("Keep this window open while using the app.");

  if (process.env.NO_OPEN !== "1") {
    const opener = process.platform === "win32" ? ["cmd", ["/c", "start", "", urlString]]
      : process.platform === "darwin" ? ["open", [urlString]]
      : ["xdg-open", [urlString]];
    try {
      const { spawn } = await import("node:child_process");
      spawn(opener[0], opener[1], { detached: true, stdio: "ignore" }).unref();
    } catch (err) {
      console.warn("Could not auto-open browser:", err.message);
    }
  }
})();
