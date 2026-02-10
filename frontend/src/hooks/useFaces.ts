import { useEffect, useState, useCallback } from "react";
import type { FacePerson } from "../types";
import { fetchFaces } from "../api";

export function useFaces() {
  const [faces, setFaces] = useState<FacePerson[]>([]);

  const refresh = useCallback(() => {
    fetchFaces().then(setFaces).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { faces, refresh };
}
