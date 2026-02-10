import { useState } from "react";
import Layout from "./components/Layout";
import VideoFeed from "./components/VideoFeed";
import ControlBar from "./components/ControlBar";
import StatsPanel from "./components/StatsPanel";
import SettingsPanel from "./components/SettingsPanel";
import ScreenshotGallery from "./components/ScreenshotGallery";
import FacePanel from "./components/FacePanel";
import CollapsiblePanel from "./components/ui/CollapsiblePanel";
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
    <Layout running={stats.running} paused={stats.paused}>
      {/* Main video area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <ControlBar
          running={stats.running}
          paused={stats.paused}
          fps={stats.fps}
          onStart={handleStart}
        />
        <VideoFeed running={stats.running} paused={stats.paused} streamKey={streamKey} />
      </div>

      {/* Sidebar */}
      <aside className="w-full lg:w-80 flex flex-col gap-2 shrink-0 lg:max-h-[calc(100vh-4.5rem)] lg:overflow-y-auto">
        <CollapsiblePanel title="Statistics" defaultOpen storageKey="stats">
          <StatsPanel stats={stats} />
        </CollapsiblePanel>

        <CollapsiblePanel title="Settings" defaultOpen storageKey="settings">
          <SettingsPanel settings={settings} onUpdate={update} />
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Face Recognition"
          storageKey="faces"
        >
          <FacePanel />
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Screenshots"
          storageKey="screenshots"
          badge={
            stats.screenshots > 0 ? (
              <span className="text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded-full font-mono normal-case">
                {stats.screenshots}
              </span>
            ) : undefined
          }
        >
          <ScreenshotGallery screenshotCount={stats.screenshots} />
        </CollapsiblePanel>
      </aside>
    </Layout>
  );
}
