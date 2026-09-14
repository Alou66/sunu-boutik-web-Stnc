import { api, User } from "@/lib/api";

export interface ShopProfileUpdate {
  name?: string;
  address?: string;
  phone?: string;
  phone2?: string;
  phone3?: string;
  ninea?: string;
  rc?: string;
}

export function updateShopProfile(payload: ShopProfileUpdate) {
  return api.patch("/auth/shop", payload);
}

export interface MyProfileUpdate {
  full_name?: string;
  phone?: string;
  email?: string;
}

// Modifie les informations personnelles de l'utilisateur connecté (owner ou
// employee). Un employee n'a que ce moyen de changer ses infos : le
// propriétaire ne peut plus le faire à sa place (voir /employees côté API).
export function updateMyProfile(payload: MyProfileUpdate) {
  return api.patch<User>("/auth/me", payload);
}
