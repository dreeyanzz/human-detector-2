import { useState } from "react";
import { streamUrl } from "../api";
import Spinner from "./ui/Spinner";

type FeedState = "idle" | "connecting" | "streaming" | "error";

interface Props {
  running: boolean;
  paused: boolean;
  streamKey: number;
}

export default function VideoFeed({ running, paused, streamKey }: Props) {
  const [state, setState] = useState<FeedState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const actualState: FeedState = !running
    ? "idle"
    : state === "error"
      ? "error"
      : state === "streaming"
        ? "streaming"
        : "connecting";

  const handleLoad = () => setState("streaming");
  const handleError = () => {
    if (running) {
      setErrorMsg("Failed to connect to camera stream");
      setState("error");
    }
  };

  // Reset when streamKey changes (new start)
  const onStart = () => {
    setState("connecting");
    setErrorMsg("");
  };

  return (
    <div className="relative flex-1 aspect-video rounded-xl border border-gray-800/50 overflow-hidden flex items-center justify-center min-h-[300px] max-h-[70vh] bg-gray-900">
      {/* Grid pattern background for non-streaming states */}
      {actualState !== "streaming" && (
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      )}

      {/* Idle */}
      {actualState === "idle" && (
        <div className="flex flex-col items-center gap-4 text-gray-600 select-none motion-safe:animate-fade-in">
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-lg">Press <span className="text-accent font-semibold">Start</span> to begin detection</p>
        </div>
      )}

      {/* Connecting */}
      {actualState === "connecting" && (
        <div className="flex flex-col items-center gap-4 select-none motion-safe:animate-fade-in">
          <Spinner size="lg" />
          <p className="text-gray-400">Connecting to camera...</p>
        </div>
      )}

      {/* Streaming */}
      {running && (
        <img
          key={streamKey}
          src={streamUrl(streamKey)}
          alt="Live detection feed"
          className={`w-full h-full object-contain ${actualState === "streaming" ? "ring-1 ring-accent/30" : "hidden"}`}
          onLoad={handleLoad}
          onLoadStart={onStart}
          onError={handleError}
        />
      )}

      {/* LIVE badge */}
      {actualState === "streaming" && !paused && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
            <span className="relative rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="text-xs font-bold text-white tracking-wider">LIVE</span>
        </div>
      )}

      {/* PAUSED badge */}
      {actualState === "streaming" && paused && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-yellow-600/90 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-lg">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
          <span className="text-xs font-bold text-white tracking-wider">PAUSED</span>
        </div>
      )}

      {/* Error */}
      {actualState === "error" && (
        <div className="flex flex-col items-center gap-4 text-red-400 select-none motion-safe:animate-fade-in">
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
