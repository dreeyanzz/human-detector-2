import { startDetection, pauseDetection, stopDetection, takeScreenshot } from "../api";

interface Props {
  running: boolean;
  paused: boolean;
  onStart: () => void;
}

export default function ControlBar({ running, paused, onStart }: Props) {
  const handleStart = async () => {
    await startDetection();
    onStart();
  };

  const handlePause = async () => {
    await pauseDetection();
  };

  const handleStop = async () => {
    await stopDetection();
  };

  const handleScreenshot = async () => {
    await takeScreenshot();
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!running ? (
        <button
          onClick={handleStart}
          className="px-5 py-2 rounded-lg bg-accent text-gray-950 font-semibold hover:bg-accent-hover transition-colors"
        >
          Start
        </button>
      ) : (
        <>
          <button
            onClick={handlePause}
            className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={handleStop}
            className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors"
          >
            Stop
          </button>
          <button
            onClick={handleScreenshot}
            className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            Screenshot
          </button>
        </>
      )}
    </div>
  );
}
