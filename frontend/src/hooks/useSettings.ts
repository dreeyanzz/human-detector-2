import { useEffect, useState, useCallback } from "react";
import type { Settings } from "../types";
import { fetchSettings, updateSettings as apiUpdate } from "../api";

const DEFAULT_SETTINGS: Settings = {
  confidence: 0.45,
  camera_index: 0,
  model_name: "yolov8n.pt",
  show_labels: true,
  show_confidence: true,
  face_recognition_enabled: false,
  face_recognition_tolerance: 0.6,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    fetchSettings().then(setSettings).catch(() => {});
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    // optimistic update
    setSettings((prev) => ({ ...prev, ...patch }));
    try {
      const result = await apiUpdate(patch);
      setSettings(result);
    } catch {
      // revert on error
      const fresh = await fetchSettings();
      setSettings(fresh);
    }
  }, []);

  return { settings, update };
}
