// Message affiché une seule fois sur /admin/login après une réinitialisation
// de mot de passe (voir AdminForgotPasswordPage), même principe que
// lib/auth-context.tsx::SESSION_MESSAGE_KEY côté boutique.
export const ADMIN_SESSION_MESSAGE_KEY = "sunu-admin-session-message";

export const statusLabels: Record<string, string> = {
  pending: "En attente",
  approved: "Validée",
  rejected: "Rejetée",
  suspended: "Suspendue",
};

export const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-gray-200 text-gray-700",
};
