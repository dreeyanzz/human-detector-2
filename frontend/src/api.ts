import type { Stats, Settings, Screenshot } from "./types";

const BASE = "/api";

async function json<T>(res: Promise<Response>): Promise<T> {
  const r = await res;
  return r.json() as Promise<T>;
}

// Controls
export const startDetection = () => json<{ status: string }>(fetch(`${BASE}/start`, { method: "POST" }));
export const pauseDetection = () => json<{ status: string }>(fetch(`${BASE}/pause`, { method: "POST" }));
export const stopDetection = () => json<Record<string, unknown>>(fetch(`${BASE}/stop`, { method: "POST" }));

// Stats
export const fetchStats = () => json<Stats>(fetch(`${BASE}/stats`));

// Settings
export const fetchSettings = () => json<Settings>(fetch(`${BASE}/settings`));
export const updateSettings = (data: Partial<Settings>) =>
  json<Settings>(fetch(`${BASE}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }));

// Screenshots
export const takeScreenshot = () => json<{ status: string; filename?: string }>(fetch(`${BASE}/screenshot`, { method: "POST" }));
export const fetchScreenshots = () => json<Screenshot[]>(fetch(`${BASE}/screenshots`));

// Stream URL (not a fetch — used as <img> src)
export const streamUrl = (cacheBust: number) => `${BASE}/stream?t=${cacheBust}`;
