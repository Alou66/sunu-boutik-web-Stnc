import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { StockReceipt } from "./approvisionnements.types";
import { fetchStockReceipts } from "./approvisionnements.api";

export function useStockReceipts(page: number, statusFilter: string, supplierId: number | "", date: string) {
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchStockReceipts(page, statusFilter, supplierId, date);
      setReceipts(list.items);
      setTotal(list.total);
      setTotalPages(list.total_pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, supplierId, date]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { receipts, total, totalPages, loading, error, reload };
}
