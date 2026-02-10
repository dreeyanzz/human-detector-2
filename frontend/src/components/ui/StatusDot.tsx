interface Props {
  status: "live" | "paused" | "stopped";
}

const CONFIG = {
  live: { color: "bg-green-400", pulse: true, label: "Live" },
  paused: { color: "bg-yellow-400", pulse: false, label: "Paused" },
  stopped: { color: "bg-gray-500", pulse: false, label: "Stopped" },
};

export default function StatusDot({ status }: Props) {
  const { color, pulse, label } = CONFIG[status];
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {pulse && (
          <span className={`absolute inset-0 rounded-full ${color} opacity-75 animate-ping`} />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
      </span>
      <span className="text-sm text-gray-400">{label}</span>
    </span>
  );
}
