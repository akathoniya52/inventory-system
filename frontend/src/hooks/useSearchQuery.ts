import { useSearchParams } from "react-router-dom";

/**
 * Reads/writes the `?q=` search param so the global top-bar search and the
 * per-page search boxes share a single source of truth.
 */
export function useSearchQuery(): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";

  const setQ = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set("q", value);
    else next.delete("q");
    setParams(next, { replace: true });
  };

  return [q, setQ];
}
