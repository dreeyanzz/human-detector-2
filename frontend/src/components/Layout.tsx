import type { ReactNode } from "react";
import StatusDot from "./ui/StatusDot";

interface Props {
  children: ReactNode;
  running: boolean;
  paused: boolean;
}

export default function Layout({ children, running, paused }: Props) {
  const status = running ? (paused ? "paused" : "live") : "stopped";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-950/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: icon + title */}
          <div className="flex items-center gap-2.5">
            <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Person Detection System
            </h1>
          </div>

          {/* Center: status */}
          <StatusDot status={status} />

          {/* Right: version */}
          <span className="text-xs text-gray-500 border border-gray-800 rounded-full px-2.5 py-0.5">
            v2.0
          </span>
        </div>
        {/* Gradient bottom edge */}
        <div className="h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      </header>

      {/* Content with top padding for fixed header */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 pt-16 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
