import { api } from "@/lib/api";

// Réinitialisation par e-mail + code temporaire : /request envoie un code par
// e-mail (réponse identique que le compte existe ou non), /confirm le vérifie
// et change le mot de passe.
export function requestPasswordReset(email: string) {
  return api.post<{ message: string }>("/auth/forgot-password/request", { email });
}

export function confirmPasswordReset(email: string, code: string, newPassword: string) {
  return api.post("/auth/forgot-password/confirm", {
    email,
    code,
    new_password: newPassword,
  });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return api.post("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}
