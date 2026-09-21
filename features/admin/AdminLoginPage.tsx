"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import PasswordInput from "@/components/PasswordInput";
import { loginAdmin } from "./admin.api";
import { ADMIN_SESSION_MESSAGE_KEY } from "./admin.constants";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Lecture dans un effet (jamais exécuté côté serveur), pas dans l'état
    // initial : sessionStorage n'existe pas pendant le rendu SSR, un
    // useState(() => sessionStorage...) y rendrait "" alors que le client y lit
    // le vrai message juste après, ce qui produirait deux HTML différents et
    // une erreur d'hydratation. Même pattern que LoginPage.tsx côté boutique.
    try {
      const stored = window.sessionStorage.getItem(ADMIN_SESSION_MESSAGE_KEY);
      if (stored) {
        setSessionMessage(stored);
        window.sessionStorage.removeItem(ADMIN_SESSION_MESSAGE_KEY);
      }
    } catch {
      // ignore (stockage indisponible)
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginAdmin(email, password);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Administration</h1>
        <p className="text-center text-gray-500 mb-6">Accès réservé</p>

        {sessionMessage && (
          <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">{sessionMessage}</p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <PasswordInput
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              ringClassName="focus:ring-gray-800"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-900 text-white rounded-md py-2 font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-sm text-center mt-3">
          <Link href="/admin/forgot-password" className="text-gray-500 hover:text-gray-800 hover:underline">
            Mot de passe oublié ?
          </Link>
        </p>
      </div>
    </div>
  );
}
