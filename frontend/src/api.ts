import type { Stats, Settings, Screenshot, FacePerson } from "./types";

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

// Faces
export interface EnrollResult {
  status: string;
  name?: string;
  sample_count?: number;
  message?: string;
  gpu_failed?: boolean;
  filename?: string;
}
export const fetchFaces = () => json<FacePerson[]>(fetch(`${BASE}/faces`));
export const fetchGpuInfo = () => json<{ has_gpu: boolean }>(fetch(`${BASE}/faces/gpu`));
export const enrollFaceFromCamera = (name: string, cpuOnly = false) =>
  json<EnrollResult>(
    fetch(`${BASE}/faces/enroll`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, cpu_only: cpuOnly }) })
  );
export const uploadFacePhoto = (name: string, file: File, cpuOnly = false) => {
  const form = new FormData();
  form.append("name", name);
  form.append("files", file);
  form.append("cpu_only", cpuOnly ? "true" : "false");
  return json<EnrollResult>(
    fetch(`${BASE}/faces/upload`, { method: "POST", body: form })
  );
};
export const deleteFace = (name: string) =>
  json<{ status: string }>(fetch(`${BASE}/faces/${encodeURIComponent(name)}`, { method: "DELETE" }));

// Stream URL (not a fetch — used as <img> src)
export const streamUrl = (cacheBust: number) => `${BASE}/stream?t=${cacheBust}`;
