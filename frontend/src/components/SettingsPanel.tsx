import type { Settings } from "../types";

interface Props {
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
}

export default function SettingsPanel({ settings, onUpdate }: Props) {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Settings</h3>

      {/* Confidence slider */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-300">Confidence</span>
          <span className="text-accent font-mono">{settings.confidence.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={0.95}
          step={0.05}
          value={settings.confidence}
          onChange={(e) => onUpdate({ confidence: parseFloat(e.target.value) })}
          className="w-full accent-cyan-400"
        />
      </div>

      {/* Model selection */}
      <div>
        <span className="text-sm text-gray-300 block mb-2">Model</span>
        {[
          { label: "Fast (nano)", value: "yolov8n.pt" },
          { label: "Accurate (medium)", value: "yolov8m.pt" },
        ].map((m) => (
          <label key={m.value} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
            <input
              type="radio"
              name="model"
              checked={settings.model_name === m.value}
              onChange={() => onUpdate({ model_name: m.value })}
              className="accent-cyan-400"
            />
            <span className="text-gray-300">{m.label}</span>
          </label>
        ))}
      </div>

      {/* Display toggles */}
      <div>
        <span className="text-sm text-gray-300 block mb-2">Display</span>
        <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.show_labels}
            onChange={(e) => onUpdate({ show_labels: e.target.checked })}
            className="accent-cyan-400"
          />
          <span className="text-gray-300">Show ID Labels</span>
        </label>
        <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.show_confidence}
            onChange={(e) => onUpdate({ show_confidence: e.target.checked })}
            className="accent-cyan-400"
          />
          <span className="text-gray-300">Show Confidence</span>
        </label>
      </div>

      {/* Camera index */}
      <div>
        <span className="text-sm text-gray-300 block mb-2">Camera</span>
        <select
          value={settings.camera_index}
          onChange={(e) => onUpdate({ camera_index: parseInt(e.target.value) })}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300 w-full"
        >
          <option value={0}>Camera 0</option>
          <option value={1}>Camera 1</option>
          <option value={2}>Camera 2</option>
        </select>
      </div>
    </div>
  );
}
