import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { Supplier } from "./suppliers.types";
import { fetchAllSuppliers, fetchSuppliers } from "./suppliers.api";

export function useSuppliers(page: number, search: string) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchSuppliers(page, search);
      setSuppliers(list.items);
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

  return { suppliers, total, totalPages, loading, error, setError, reload };
}

export function useAllSuppliers() {
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);

  const reload = useCallback(() => {
    fetchAllSuppliers()
      .then(setAllSuppliers)
      .catch(() => {});
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { allSuppliers, reload };
}
