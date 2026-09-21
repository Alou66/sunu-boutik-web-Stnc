"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";
import { ApiError } from "@/lib/api";
// Même mécanisme que la boutique (owner/employee) : /auth/forgot-password/* est
// un flux par e-mail commun à tous les rôles, y compris ADMIN (voir
// IdentityService.request_password_reset / confirm_password_reset côté API).
// On réutilise donc directement ces appels plutôt que d'en dupliquer une
// deuxième version pour l'admin ; seule la présentation ci-dessous est propre
// au thème sombre de l'espace administration.
import { confirmPasswordReset, requestPasswordReset } from "@/features/auth/auth.api";
import { ADMIN_SESSION_MESSAGE_KEY } from "./admin.constants";

type Step = "email" | "reset" | "done";

const CODE_LENGTH = 6;
const RESEND_DELAY_SECONDS = 60;

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  async function onRequestCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setCode("");
      setResendIn(RESEND_DELAY_SECONDS);
      setStep("reset");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setCode("");
      setResendIn(RESEND_DELAY_SECONDS);
      setInfo("Un nouveau code a été envoyé. L'ancien n'est plus valable.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (code.length !== CODE_LENGTH) {
      setError(`Le code contient ${CODE_LENGTH} chiffres`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(email.trim(), code, newPassword);
      setStep("done");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la réinitialisation");
    } finally {
      setSubmitting(false);
    }
  }

  function onGoToLogin() {
    try {
      window.sessionStorage.setItem(
        ADMIN_SESSION_MESSAGE_KEY,
        "Votre mot de passe a été réinitialisé. Connectez-vous avec votre nouveau mot de passe."
      );
    } catch {
      // ignore (stockage indisponible)
    }
    router.push("/admin/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Administration</h1>
        <p className="text-center text-gray-500 mb-6">Mot de passe oublié</p>

        {step === "email" && (
          <>
            <p className="text-center text-gray-500 text-sm mb-6">
              Entrez l&apos;adresse e-mail de votre compte administrateur, nous vous enverrons un code de vérification
            </p>
            <form onSubmit={onRequestCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse e-mail</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@exemple.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gray-900 text-white rounded-md py-2 font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? "Envoi..." : "Envoyer le code"}
              </button>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            {/* Message volontairement neutre : on ne confirme pas que le compte existe. */}
            <p className="text-center text-sm text-gray-500 mb-1">
              Si un compte correspond à{" "}
              <span className="font-semibold text-gray-800 break-all">{email.trim()}</span>, un code à{" "}
              {CODE_LENGTH} chiffres vient de lui être envoyé.
            </p>
            <p className="text-center text-sm text-gray-500 mb-6">
              Il est valable 15 minutes. Saisissez-le puis choisissez un nouveau mot de passe.
            </p>
            <form onSubmit={onReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code reçu par e-mail</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
                  placeholder="123456"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-center font-mono text-lg tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <PasswordInput
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  ringClassName="focus:ring-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <PasswordInput
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  ringClassName="focus:ring-gray-800"
                />
              </div>
              {info && <p className="text-sm text-green-700">{info}</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gray-900 text-white rounded-md py-2 font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? "Enregistrement..." : "Réinitialiser le mot de passe"}
              </button>
              <button
                type="button"
                onClick={onResend}
                disabled={submitting || resendIn > 0}
                className="w-full text-sm text-gray-700 hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                {resendIn > 0 ? `Renvoyer un code (${resendIn} s)` : "Renvoyer un code"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); setInfo(""); }}
                className="w-full text-sm text-gray-500 hover:underline"
              >
                ← Changer d&apos;adresse e-mail
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="text-center space-y-4 mt-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="font-semibold text-gray-800">Mot de passe réinitialisé !</p>
            <p className="text-sm text-gray-500">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
            <button
              onClick={onGoToLogin}
              className="w-full bg-gray-900 text-white rounded-md py-2 font-medium hover:bg-gray-800"
            >
              Se connecter
            </button>
          </div>
        )}

        {step !== "done" && (
          <p className="text-sm text-center text-gray-500 mt-6">
            <Link href="/admin/login" className="text-gray-700 hover:underline">
              ← Retour à la connexion
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
