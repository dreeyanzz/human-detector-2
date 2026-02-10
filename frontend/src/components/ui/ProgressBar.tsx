interface Props {
  value: number; // 0–100
  label?: string;
}

export default function ProgressBar({ value, label }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">{label}</span>
          <span className="text-accent font-mono">{Math.round(clamped)}%</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
