import { useState, useCallback } from "react";

interface AsyncState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
  execute: (...args: unknown[]) => Promise<T | undefined>;
}

export function useAsync<T>(fn: (...args: unknown[]) => Promise<T>): AsyncState<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn(...args);
        setData(result);
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "An error occurred";
        setError(msg);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [fn]
  );

  return { loading, error, data, execute };
}
