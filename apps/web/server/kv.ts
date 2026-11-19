// LANE C. Tiny key-value store for the SIMULATED retailer gift-card system (server only).
//   - Production / Vercel: Upstash Redis over its REST API (UPSTASH_REDIS_REST_URL + _TOKEN). No SDK needed.
//   - Local dev without Upstash: a JSON file at apps/web/.data/kv.json (gitignored).
// Payments are NEVER stored here — they live on chain. This only holds simulated card records.
import "server-only";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface KV {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  /** Set only if absent. Returns true if it was set (used as a lock / claim). */
  setNX(key: string, value: unknown, ttlSeconds?: number): Promise<boolean>;
  del(key: string): Promise<void>;
  /** Append to a list. */
  rpush(key: string, value: string): Promise<void>;
  lrange(key: string): Promise<string[]>;
}

class UpstashKV implements KV {
  private url: string;
  private token: string;
  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }
  private async cmd<T>(...args: (string | number)[]): Promise<T> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    const body = (await res.json()) as { result?: T; error?: string };
    if (!res.ok || body.error) throw new Error(`Upstash: ${body.error ?? res.status}`);
    return body.result as T;
  }
  async get<T>(key: string) {
    const r = await this.cmd<string | null>("GET", key);
    return r === null ? null : (JSON.parse(r) as T);
  }
  async set(key: string, value: unknown) {
    await this.cmd("SET", key, JSON.stringify(value));
  }
  async setNX(key: string, value: unknown, ttlSeconds?: number) {
    const args: (string | number)[] = ["SET", key, JSON.stringify(value), "NX"];
    if (ttlSeconds) args.push("EX", ttlSeconds);
    return (await this.cmd<string | null>(...args)) === "OK";
  }
  async del(key: string) {
    await this.cmd("DEL", key);
  }
  async rpush(key: string, value: string) {
    await this.cmd("RPUSH", key, value);
  }
  async lrange(key: string) {
    return this.cmd<string[]>("LRANGE", key, 0, -1);
  }
}

type FileData = { kv: Record<string, { v: string; exp?: number }>; lists: Record<string, string[]> };

class FileKV implements KV {
  private path: string;
  constructor(path: string) {
    this.path = path;
  }
  protected load(): FileData {
    try {
      return JSON.parse(readFileSync(this.path, "utf8")) as FileData;
    } catch {
      return { kv: {}, lists: {} };
    }
  }
  protected save(d: FileData) {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(d, null, 2), { mode: 0o600 });
  }
  private live(d: FileData, key: string) {
    const e = d.kv[key];
    if (e?.exp && e.exp < Date.now()) delete d.kv[key];
    return d.kv[key];
  }
  async get<T>(key: string) {
    const e = this.live(this.load(), key);
    return e ? (JSON.parse(e.v) as T) : null;
  }
  async set(key: string, value: unknown) {
    const d = this.load();
    d.kv[key] = { v: JSON.stringify(value) };
    this.save(d);
  }
  async setNX(key: string, value: unknown, ttlSeconds?: number) {
    const d = this.load();
    if (this.live(d, key)) return false;
    d.kv[key] = { v: JSON.stringify(value), exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined };
    this.save(d);
    return true;
  }
  async del(key: string) {
    const d = this.load();
    delete d.kv[key];
    this.save(d);
  }
  async rpush(key: string, value: string) {
    const d = this.load();
    (d.lists[key] ??= []).push(value);
    this.save(d);
  }
  async lrange(key: string) {
    return this.load().lists[key] ?? [];
  }
}

/** In-memory KV for tests. */
export class MemoryKV extends FileKV {
  private mem: FileData = { kv: {}, lists: {} };
  constructor() {
    super("");
  }
  protected override load(): FileData {
    return this.mem;
  }
  protected override save(d: FileData) {
    this.mem = d;
  }
}

let instance: KV | null = null;

export function kv(): KV {
  if (instance) return instance;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) instance = new UpstashKV(url, token);
  else if (process.env.VERCEL) throw new Error("Set UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN on Vercel.");
  else instance = new FileKV(process.env.SWAY_KV_FILE ?? join(process.cwd(), ".data", "kv.json"));
  return instance;
}

/** Test hook. */
export function setKV(k: KV | null) {
  instance = k;
}
