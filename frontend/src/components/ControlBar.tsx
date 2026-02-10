import { useState } from "react";
import { startDetection, pauseDetection, stopDetection, takeScreenshot } from "../api";
import { useToast } from "./ui/useToast";
import Modal from "./ui/Modal";
import Spinner from "./ui/Spinner";

interface Props {
  running: boolean;
  paused: boolean;
  fps: number;
  onStart: () => void;
}

export default function ControlBar({ running, paused, fps, onStart }: Props) {
  const toast = useToast();
  const [starting, setStarting] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [screenshotting, setScreenshotting] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [stopping, setStopping] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      await startDetection();
      onStart();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start detection");
    } finally {
      setStarting(false);
    }
  };

  const handlePause = async () => {
    setPausing(true);
    try {
      await pauseDetection();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to pause");
    } finally {
      setPausing(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await stopDetection();
      setShowStopConfirm(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to stop");
    } finally {
      setStopping(false);
    }
  };

  const handleScreenshot = async () => {
    setScreenshotting(true);
    try {
      await takeScreenshot();
      toast.success("Screenshot saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Screenshot failed");
    } finally {
      setScreenshotting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {!running ? (
          <button
            onClick={handleStart}
            disabled={starting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 text-gray-950 font-semibold shadow-glow-sm hover:shadow-glow-md transition-all disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            {starting && <Spinner size="sm" className="text-gray-950" />}
            Start
          </button>
        ) : (
          <>
            <button
              onClick={handlePause}
              disabled={pausing}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600 hover:text-white transition-all disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              {pausing && <Spinner size="sm" />}
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={() => setShowStopConfirm(true)}
              className="px-5 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Stop
            </button>
            <button
              onClick={handleScreenshot}
              disabled={screenshotting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600 hover:text-white transition-all disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              {screenshotting ? (
                <Spinner size="sm" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              )}
              Screenshot
            </button>

            {/* FPS badge */}
            <span className="ml-auto bg-gray-800/50 border border-gray-700/50 rounded-full px-3 py-1 font-mono text-xs text-gray-400">
              <span className="text-accent">{fps}</span> FPS
            </span>
          </>
        )}
      </div>

      {/* Stop confirmation modal */}
      <Modal open={showStopConfirm} onClose={() => setShowStopConfirm(false)}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Stop Detection?</h3>
              <p className="text-sm text-gray-400">This will end the current session and stop the camera.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowStopConfirm(false)}
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleStop}
              disabled={stopping}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors text-sm disabled:opacity-60"
            >
              {stopping && <Spinner size="sm" className="text-white" />}
              Stop Detection
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
