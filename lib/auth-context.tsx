"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, clearToken, getToken, setToken, Shop, User, SESSION_EXPIRED_EVENT } from "./api";

export const SESSION_MESSAGE_KEY = "sunu-session-message";

interface AuthContextValue {
  user: User | null;
  shop: Shop | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    shop_name: string;
    shop_address?: string;
    shop_phone?: string;
    shop_phone2?: string;
    shop_phone3?: string;
    shop_ninea?: string;
    shop_rc?: string;
    full_name: string;
    email: string;
  }) => Promise<string>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadMe() {
    try {
      const me = await api.get<{ user: User; shop: Shop }>("/auth/me");
      setUser(me.user);
      setShop(me.shop);
    } catch {
      clearToken();
      setUser(null);
      setShop(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (getToken()) {
      loadMe();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Un compte désactivé pendant qu'une session est ouverte doit être coupé
    // à la prochaine requête (voir lib/api.ts) : on vide la session locale et
    // on redirige immédiatement, sans laisser l'utilisateur sur une page avec
    // des données déjà chargées.
    function onSessionExpired(e: Event) {
      const message = (e as CustomEvent<string>).detail || "Votre session a expiré, veuillez vous reconnecter.";
      try {
        window.sessionStorage.setItem(SESSION_MESSAGE_KEY, message);
      } catch {
        // ignore (stockage indisponible)
      }
      clearToken();
      setUser(null);
      setShop(null);
      router.replace("/login");
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [router]);

  async function login(email: string, password: string) {
    const res = await api.post<{ access_token: string }>("/auth/login", { email, password });
    setToken(res.access_token);
    const me = await api.get<{ user: User; shop: Shop }>("/auth/me");
    setUser(me.user);
    setShop(me.shop);
    router.push(me.user.must_change_password ? "/change-password" : "/dashboard/articles");
  }

  async function register(payload: {
    shop_name: string;
    shop_address?: string;
    shop_phone?: string;
    shop_phone2?: string;
    shop_phone3?: string;
    shop_ninea?: string;
    shop_rc?: string;
    full_name: string;
    email: string;
  }) {
    const res = await api.post<{ message: string }>("/auth/register", payload);
    return res.message;
  }

  function logout() {
    clearToken();
    setUser(null);
    setShop(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, shop, loading, login, register, logout, refreshMe: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
