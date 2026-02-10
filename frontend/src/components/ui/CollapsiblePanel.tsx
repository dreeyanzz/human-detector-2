import { useState, useEffect } from "react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  defaultOpen?: boolean;
  storageKey?: string;
  children: ReactNode;
  badge?: ReactNode;
}

export default function CollapsiblePanel({ title, defaultOpen = false, storageKey, children, badge }: Props) {
  const [open, setOpen] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(`panel-${storageKey}`);
      if (stored !== null) return stored === "1";
    }
    return defaultOpen;
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`panel-${storageKey}`, open ? "1" : "0");
    }
  }, [open, storageKey]);

  return (
    <div className="bg-gray-900 border border-gray-800/50 rounded-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus:outline-none"
      >
        <span className="flex items-center gap-2">
          {title}
          {badge}
        </span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="px-3 pb-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
