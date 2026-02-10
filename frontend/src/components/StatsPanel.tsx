import type { Stats } from "../types";
import AnimatedNumber from "./ui/AnimatedNumber";

interface Props {
  stats: Stats;
}

const STAT_ICONS = {
  people: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  group: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  gauge: "M13 10V3L4 14h7v7l9-11h-7z",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
};

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-gray-800/50 rounded-lg px-3 py-2.5 ${
        highlight ? "ring-1 ring-accent/30" : ""
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider leading-tight">{label}</div>
          <div className="text-xl font-bold text-white leading-tight">
            <AnimatedNumber value={value} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StatsPanel({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard
        label="In Frame"
        value={stats.people_count}
        icon={STAT_ICONS.people}
        highlight={stats.people_count > 0}
      />
      <StatCard label="Total Unique" value={stats.total_unique} icon={STAT_ICONS.group} />
      <StatCard label="FPS" value={stats.fps} icon={STAT_ICONS.gauge} />
      <StatCard label="Session" value={stats.session_time || "--:--"} icon={STAT_ICONS.clock} />
    </div>
  );
}
