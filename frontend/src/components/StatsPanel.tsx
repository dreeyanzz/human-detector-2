import type { Stats } from "../types";

interface Props {
  stats: Stats;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-accent">{value}</div>
    </div>
  );
}

export default function StatsPanel({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="People in Frame" value={stats.people_count} />
      <StatCard label="Total Unique" value={stats.total_unique} />
      <StatCard label="FPS" value={stats.fps} />
      <StatCard label="Session Time" value={stats.session_time || "--:--:--"} />
    </div>
  );
}
