import { api, ApiError, getToken } from "@/lib/api";
import { Invoice, InvoiceList, Payment } from "./factures.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function fetchInvoices(
  page: number,
  pageSize: number,
  search: string,
  date: string,
  statusFilter: string,
  employeeId: string = ""
) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) params.set("search", search);
  if (date) params.set("date", date);
  if (statusFilter) params.set("status_filter", statusFilter);
  if (employeeId) params.set("employee_id", employeeId);
  return api.get<InvoiceList>(`/invoices?${params.toString()}`);
}

export function fetchInvoice(id: number) {
  return api.get<Invoice>(`/invoices/${id}`);
}

export function createInvoice(payload: unknown) {
  return api.post<Invoice>("/invoices", payload);
}

export function updateInvoice(id: number, payload: unknown) {
  return api.patch<Invoice>(`/invoices/${id}`, payload);
}

export function cancelInvoice(id: number, reason: string) {
  return api.post<Invoice>(`/invoices/${id}/cancel`, { reason });
}

export function deleteInvoice(id: number) {
  return api.delete<void>(`/invoices/${id}`);
}

export function pdfUrl(invoiceId: number): string {
  return `${API_URL}/invoices/${invoiceId}/pdf`;
}

export async function fetchPdfBlob(invoiceId: number): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${API_URL}/invoices/${invoiceId}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError("Impossible de générer le PDF", res.status);
  return res.blob();
}

export function fetchPayments(invoiceId: number) {
  return api.get<Payment[]>(`/invoices/${invoiceId}/payments`);
}

export function createPayment(
  invoiceId: number,
  payload: { amount: number; amount_received: number | null; note: string | null; idempotency_key: string }
) {
  return api.post(`/invoices/${invoiceId}/payments`, payload);
}

export function voidPayment(invoiceId: number, paymentId: number, reason: string) {
  return api.post(`/invoices/${invoiceId}/payments/${paymentId}/void`, { reason });
}
