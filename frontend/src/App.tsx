import { useState } from "react";
import Layout from "./components/Layout";
import VideoFeed from "./components/VideoFeed";
import ControlBar from "./components/ControlBar";
import StatsPanel from "./components/StatsPanel";
import SettingsPanel from "./components/SettingsPanel";
import ScreenshotGallery from "./components/ScreenshotGallery";
import { useStats } from "./hooks/useStats";
import { useSettings } from "./hooks/useSettings";

export default function App() {
  const stats = useStats();
  const { settings, update } = useSettings();
  const [streamKey, setStreamKey] = useState(0);

  const handleStart = () => {
    setStreamKey(Date.now());
  };

  return (
    <Layout>
      {/* Main video area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between">
          <ControlBar
            running={stats.running}
            paused={stats.paused}
            onStart={handleStart}
          />
          {stats.running && (
            <span className="text-sm text-gray-400">
              FPS: <span className="text-accent font-mono">{stats.fps}</span>
            </span>
          )}
        </div>
        <VideoFeed running={stats.running} streamKey={streamKey} />
      </div>

      {/* Sidebar */}
      <aside className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
        <StatsPanel stats={stats} />
        <div className="bg-gray-900 rounded-xl p-4">
          <SettingsPanel settings={settings} onUpdate={update} />
        </div>
        <div className="bg-gray-900 rounded-xl p-4">
          <ScreenshotGallery />
        </div>
      </aside>
    </Layout>
  );
}
