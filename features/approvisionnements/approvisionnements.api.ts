import { api } from "@/lib/api";
import { StockMovementList, StockReceipt, StockReceiptLineInput, StockReceiptList } from "./approvisionnements.types";

const PAGE_SIZE = 10;

export function fetchStockReceipts(page: number, statusFilter: string, supplierId: number | "", date: string) {
  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  if (statusFilter) params.set("status", statusFilter);
  if (supplierId) params.set("supplier_id", String(supplierId));
  if (date) params.set("date", date);
  return api.get<StockReceiptList>(`/stock-receipts?${params.toString()}`);
}

export function fetchStockReceipt(id: number) {
  return api.get<StockReceipt>(`/stock-receipts/${id}`);
}

interface StockReceiptPayload {
  supplier_id: number | null;
  reference: string | null;
  note: string | null;
  lines: StockReceiptLineInput[];
}

export function createStockReceipt(payload: StockReceiptPayload) {
  return api.post<StockReceipt>("/stock-receipts", payload);
}

export function updateStockReceipt(id: number, payload: StockReceiptPayload) {
  return api.patch<StockReceipt>(`/stock-receipts/${id}`, payload);
}

export function deleteStockReceipt(id: number) {
  return api.delete(`/stock-receipts/${id}`);
}

export function validateStockReceipt(id: number) {
  return api.post<StockReceipt>(`/stock-receipts/${id}/validate`);
}

export function cancelStockReceipt(id: number) {
  return api.post<StockReceipt>(`/stock-receipts/${id}/cancel`);
}

export function fetchStockMovements(page: number, productId?: number) {
  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  if (productId) params.set("product_id", String(productId));
  return api.get<StockMovementList>(`/stock-receipts/movements?${params.toString()}`);
}
