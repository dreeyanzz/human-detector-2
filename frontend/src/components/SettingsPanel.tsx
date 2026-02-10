import { useState } from "react";
import type { Settings } from "../types";
import ToggleSwitch from "./ui/ToggleSwitch";
import Tooltip from "./ui/Tooltip";
import Spinner from "./ui/Spinner";
import { useToast } from "./ui/useToast";

interface Props {
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
}

export default function SettingsPanel({ settings, onUpdate }: Props) {
  const toast = useToast();
  const [modelLoading, setModelLoading] = useState(false);

  const handleModelChange = async (model: string) => {
    setModelLoading(true);
    try {
      onUpdate({ model_name: model });
      toast.info(`Switching to ${model === "yolov8n.pt" ? "fast" : "accurate"} model...`);
    } finally {
      setTimeout(() => setModelLoading(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      {/* Confidence slider */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="flex items-center gap-1.5 text-gray-300">
            Confidence
            <Tooltip text="Higher = fewer but more accurate detections. Lower = more detections but more false positives.">
              <svg className="w-3.5 h-3.5 text-gray-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Tooltip>
          </span>
          <span className="text-accent font-mono text-xs">{settings.confidence.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={0.95}
          step={0.05}
          value={settings.confidence}
          onChange={(e) => onUpdate({ confidence: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Model selection */}
      <div>
        <span className="text-sm text-gray-300 flex items-center gap-2 mb-1">
          Model
          {modelLoading && <Spinner size="sm" />}
        </span>
        <div className="flex gap-2">
          {[
            { label: "Fast", value: "yolov8n.pt" },
            { label: "Accurate", value: "yolov8m.pt" },
          ].map((m) => (
            <button
              key={m.value}
              onClick={() => handleModelChange(m.value)}
              disabled={modelLoading}
              className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                settings.model_name === m.value
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Display toggles */}
      <div>
        <ToggleSwitch
          label="Show ID Labels"
          checked={settings.show_labels}
          onChange={(v) => onUpdate({ show_labels: v })}
        />
        <ToggleSwitch
          label="Show Confidence"
          checked={settings.show_confidence}
          onChange={(v) => onUpdate({ show_confidence: v })}
        />
      </div>

      {/* Face Recognition */}
      <div>
        <ToggleSwitch
          label="Face Recognition"
          checked={settings.face_recognition_enabled}
          onChange={(v) => onUpdate({ face_recognition_enabled: v })}
        />
        {settings.face_recognition_enabled && (
          <div className="mt-2 motion-safe:animate-fade-up">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Tolerance</span>
              <span className="text-accent font-mono">{settings.face_recognition_tolerance.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.3}
              max={0.8}
              step={0.05}
              value={settings.face_recognition_tolerance}
              onChange={(e) => onUpdate({ face_recognition_tolerance: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
              <span>Strict</span>
              <span>Lenient</span>
            </div>
          </div>
        )}
      </div>

      {/* Camera index */}
      <div>
        <span className="text-xs text-gray-400 block mb-1">Camera</span>
        <select
          value={settings.camera_index}
          onChange={(e) => onUpdate({ camera_index: parseInt(e.target.value) })}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 w-full focus:outline-none focus:border-accent/50 transition-colors"
        >
          <option value={0}>Camera 0</option>
          <option value={1}>Camera 1</option>
          <option value={2}>Camera 2</option>
        </select>
      </div>
    </div>
  );
}
