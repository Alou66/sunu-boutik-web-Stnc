import { api, fetchAllPages } from "@/lib/api";
import { Supplier, SupplierList } from "./suppliers.types";

const PAGE_SIZE = 10;

export function fetchSuppliers(page: number, search: string) {
  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  if (search) params.set("search", search);
  return api.get<SupplierList>(`/suppliers?${params.toString()}`);
}

export function fetchAllSuppliers() {
  return fetchAllPages<Supplier>("/suppliers", api.get<SupplierList>);
}

export function createSupplier(data: { name: string; phone: string | null; address: string | null; note: string | null }) {
  return api.post<Supplier>("/suppliers", data);
}

export function updateSupplier(id: number, data: { name: string; phone: string | null; address: string | null; note: string | null }) {
  return api.patch<Supplier>(`/suppliers/${id}`, data);
}

export function deleteSupplier(id: number) {
  return api.delete(`/suppliers/${id}`);
}
