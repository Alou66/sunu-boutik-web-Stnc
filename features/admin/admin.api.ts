import { adminApi, api, setAdminToken } from "@/lib/api";
import { Overview, ShopAdmin, ShopList, ShopStats } from "./admin.types";

export async function loginAdmin(email: string, password: string) {
  const res = await api.post<{ access_token: string }>("/admin/login", { email, password });
  setAdminToken(res.access_token);
}

export function fetchOverview() {
  return adminApi.get<Overview>("/admin/overview");
}

export function fetchShops(page: number, pageSize: number, statusFilter?: string, search?: string) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (statusFilter) params.set("status_filter", statusFilter);
  if (search) params.set("search", search);
  return adminApi.get<ShopList>(`/admin/shops?${params.toString()}`);
}

export function fetchShopStats(shopId: number) {
  return adminApi.get<ShopStats>(`/admin/shops/${shopId}/stats`);
}

export function approveShop(shopId: number) {
  return adminApi.post(`/admin/shops/${shopId}/approve`);
}

export function rejectShop(shopId: number, reason: string | null) {
  return adminApi.post(`/admin/shops/${shopId}/reject`, { reason });
}

export function suspendShop(shopId: number, reason: string | null) {
  return adminApi.patch<ShopAdmin>(`/admin/shops/${shopId}/suspend`, { reason });
}

export function reactivateShop(shopId: number) {
  return adminApi.patch<ShopAdmin>(`/admin/shops/${shopId}/reactivate`);
}

export function resetOwnerPassword(shopId: number) {
  return adminApi.post<{ message: string }>(`/admin/shops/${shopId}/owner/reset-password`);
}
