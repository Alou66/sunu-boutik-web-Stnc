import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { Employee } from "./employees.types";
import { fetchEmployees } from "./employees.api";

export function useEmployees(page: number, search: string) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchEmployees(page, search);
      setEmployees(list.items);
      setTotal(list.total);
      setTotalPages(list.total_pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { employees, total, totalPages, loading, error, setError, reload };
}
