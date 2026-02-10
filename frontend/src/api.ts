import type { Stats, Settings, Screenshot, FacePerson } from "./types";

const BASE = "/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function json<T>(res: Promise<Response>): Promise<T> {
  const r = await res;
  if (!r.ok) {
    let msg = `Request failed (${r.status})`;
    try {
      const body = await r.json();
      if (body.message) msg = body.message;
      else if (body.detail) msg = body.detail;
    } catch {
      // use default message
    }
    throw new ApiError(r.status, msg);
  }
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
export const deleteScreenshot = (name: string) =>
  json<{ status: string }>(fetch(`${BASE}/screenshots/${encodeURIComponent(name)}`, { method: "DELETE" }));

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
export interface GpuInfo {
  has_gpu: boolean;
  pytorch_cuda: boolean;
  dlib_cuda: boolean;
}
export const fetchGpuInfo = () => json<GpuInfo>(fetch(`${BASE}/faces/gpu`));
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

export async function exportFaceDb(): Promise<void> {
  const res = await fetch(`${BASE}/faces/export`);
  if (!res.ok) throw new ApiError(res.status, "Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "face_db.pkl";
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  status: string;
  imported_names?: string[];
  total_people?: number;
  message?: string;
}
export function importFaceDb(file: File, merge: boolean): Promise<ImportResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("merge", merge ? "true" : "false");
  return json<ImportResult>(
    fetch(`${BASE}/faces/import`, { method: "POST", body: form })
  );
}

// Stream URL (not a fetch — used as <img> src)
export const streamUrl = (cacheBust: number) => `${BASE}/stream?t=${cacheBust}`;
