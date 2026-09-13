import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { fetchStatistics } from "./statistics.api";
import { Statistics } from "./statistics.types";

export function useStatistics(dateFrom: string, dateTo: string) {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchStatistics(dateFrom, dateTo);
      setStats(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { stats, loading, error };
}
