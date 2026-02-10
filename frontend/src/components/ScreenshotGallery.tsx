import { useEffect, useState, useCallback } from "react";
import type { Screenshot } from "../types";
import { fetchScreenshots, deleteScreenshot } from "../api";
import { useToast } from "./ui/useToast";
import Modal from "./ui/Modal";
import Skeleton from "./ui/Skeleton";
import EmptyState from "./ui/EmptyState";

interface Props {
  screenshotCount: number;
}

export default function ScreenshotGallery({ screenshotCount }: Props) {
  const toast = useToast();
  const [shots, setShots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setShots(await fetchScreenshots());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, screenshotCount]);

  const handleDelete = async (name: string) => {
    try {
      await deleteScreenshot(name);
      setShots((prev) => prev.filter((s) => s.name !== name));
      toast.success("Screenshot deleted");
      setDeleting(null);
      if (lightbox !== null) setLightbox(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const parseName = (name: string) => {
    const match = name.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
    if (match) {
      const [, y, mo, d, h, mi, s] = match;
      return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
    }
    return name;
  };

  const navigateLightbox = (dir: -1 | 1) => {
    if (lightbox === null) return;
    const next = lightbox + dir;
    if (next >= 0 && next < shots.length) setLightbox(next);
  };

  return (
    <div>
      {loading && (
        <div className="grid grid-cols-2 gap-1.5">
          <Skeleton variant="box" className="h-16 rounded-lg" />
          <Skeleton variant="box" className="h-16 rounded-lg" />
          <Skeleton variant="box" className="h-16 rounded-lg" />
          <Skeleton variant="box" className="h-16 rounded-lg" />
        </div>
      )}

      {!loading && shots.length === 0 && (
        <EmptyState
          icon="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          message="No screenshots yet"
        />
      )}

      {!loading && shots.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto">
          {shots.map((s, i) => (
            <div
              key={s.name}
              className="group relative bg-gray-800/50 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all cursor-pointer motion-safe:animate-fade-in"
              style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
              onClick={() => setLightbox(i)}
            >
              <img
                src={`/api/screenshots/${s.name}`}
                alt={s.name}
                className="aspect-video object-cover w-full"
                loading="lazy"
              />
              <button
                onClick={(e) => { e.stopPropagation(); setDeleting(s.name); }}
                className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Modal open={lightbox !== null} onClose={() => setLightbox(null)}>
        {lightbox !== null && shots[lightbox] && (
          <div className="space-y-3">
            <img
              src={`/api/screenshots/${shots[lightbox].name}`}
              alt={shots[lightbox].name}
              className="w-full rounded-lg"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{parseName(shots[lightbox].name)}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigateLightbox(-1)}
                  disabled={lightbox === 0}
                  className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateLightbox(1)}
                  disabled={lightbox === shots.length - 1}
                  className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <a
                  href={`/api/screenshots/${shots[lightbox].name}`}
                  download={shots[lightbox].name}
                  className="p-1 text-gray-500 hover:text-accent transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                <button
                  onClick={() => setDeleting(shots[lightbox].name)}
                  className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Delete Screenshot?</h3>
              <p className="text-sm text-gray-400">This action cannot be undone.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleting(null)}
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => deleting && handleDelete(deleting)}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
