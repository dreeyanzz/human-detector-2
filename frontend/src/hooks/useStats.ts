import { useEffect, useState } from "react";
import type { Stats } from "../types";
import { fetchStats } from "../api";

const DEFAULT_STATS: Stats = {
  people_count: 0,
  total_unique: 0,
  fps: 0,
  session_time: "",
  screenshots: 0,
  running: false,
  paused: false,
};

export function useStats(intervalMs = 500): Stats {
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const data = await fetchStats();
        if (active) setStats(data);
      } catch {
        // ignore transient fetch errors
      }
    };
    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return stats;
}
