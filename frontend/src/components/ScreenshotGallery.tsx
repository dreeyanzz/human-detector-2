import { useEffect, useState, useCallback } from "react";
import type { Screenshot } from "../types";
import { fetchScreenshots } from "../api";

export default function ScreenshotGallery() {
  const [shots, setShots] = useState<Screenshot[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setShots(await fetchScreenshots());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  return (
    <div>
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) load();
        }}
        className="text-sm text-accent hover:underline"
      >
        {open ? "Hide Gallery" : "View Screenshots"}
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {shots.length === 0 ? (
            <p className="col-span-2 text-gray-500 text-sm">No screenshots yet</p>
          ) : (
            shots.map((s) => (
              <a
                key={s.name}
                href={`/api/screenshots/${s.name}`}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <img
                  src={`/api/screenshots/${s.name}`}
                  alt={s.name}
                  className="rounded border border-gray-700 hover:border-accent transition-colors"
                />
                <span className="text-[10px] text-gray-500 truncate block mt-1">{s.name}</span>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
