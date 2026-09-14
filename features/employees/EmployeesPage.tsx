"use client";

import { FormEvent, useState } from "react";
import Modal from "@/components/Modal";
import SearchBar from "@/components/SearchBar";
import SkeletonRows from "@/components/SkeletonRows";
import PasswordInput from "@/components/PasswordInput";
import { ApiError } from "@/lib/api";
import { Employee } from "./employees.types";
import { createEmployee, deleteEmployee, updateEmployee } from "./employees.api";
import { useEmployees } from "./employees.hooks";

const emptyForm = { full_name: "", phone: "", email: "", password: "" };

export default function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { employees, total, totalPages, loading, error, setError, reload } = useEmployees(page, search);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  // Employé en cours d'édition : ses infos (nom, téléphone, email) ne sont
  // affichées qu'en lecture seule, elles appartiennent désormais à l'employé
  // (voir son propre espace "Mon profil") — seul un reset de mot de passe
  // reste possible depuis cette page.
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function openCreate() {
    setEditingEmployee(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(e: Employee) {
    setEditingEmployee(e);
    setResetPassword("");
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (editingEmployee) {
      if (resetPassword && resetPassword.length < 6) {
        setFormError("Le mot de passe doit contenir au moins 6 caractères");
        return;
      }
      setSubmitting(true);
      try {
        if (resetPassword) {
          await updateEmployee(editingEmployee.id, { password: resetPassword });
        }
        closeModal();
        await reload();
      } catch (err) {
        setFormError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const full_name = form.full_name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    if (!full_name) {
      setFormError("Le nom complet est requis");
      return;
    }
    if (!phone) {
      setFormError("Le téléphone est requis");
      return;
    }
    if (!email) {
      setFormError("L'email est requis");
      return;
    }
    if (form.password.length < 6) {
      setFormError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setSubmitting(true);
    try {
      await createEmployee({ full_name, phone, email, password: form.password });
      setPage(1);
      closeModal();
      await reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  async function onToggleActive(employee: Employee) {
    try {
      await updateEmployee(employee.id, { is_active: !employee.is_active });
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la mise à jour du statut");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Supprimer cet employé ?")) return;
    try {
      await deleteEmployee(id);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Employés</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Ajouter un employé
        </button>
      </div>

      <SearchBar value={search} onChange={onSearchChange} placeholder="Rechercher un employé..." />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Nom complet</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows cols={5} />}
            {!loading && employees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">Aucun employé</td>
              </tr>
            )}
            {employees.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-4 py-3 font-medium">{e.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{e.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{e.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      e.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {e.is_active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => openEdit(e)} className="text-blue-600 hover:underline">
                    Voir / Réinitialiser
                  </button>
                  <button onClick={() => onToggleActive(e)} className="text-amber-600 hover:underline">
                    {e.is_active ? "Désactiver" : "Activer"}
                  </button>
                  <button onClick={() => onDelete(e.id)} className="text-red-600 hover:underline">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {total} employé{total > 1 ? "s" : ""} — page {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && editingEmployee && (
        <Modal title="Compte de l'employé" onClose={closeModal}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="rounded-md bg-gray-50 p-3 space-y-2 text-sm">
              <p className="text-xs text-gray-400">
                Ces informations appartiennent à l&apos;employé : il les modifie lui-même depuis son espace « Mon profil ».
              </p>
              <div>
                <p className="text-gray-500 text-xs">Nom complet</p>
                <p className="font-medium">{editingEmployee.full_name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Téléphone</p>
                <p className="font-medium">{editingEmployee.phone || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Email</p>
                <p className="font-medium">{editingEmployee.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nouveau mot de passe <span className="text-gray-400">(laisser vide pour ne pas changer)</span>
              </label>
              <PasswordInput
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-400">
                Si renseigné, l&apos;employé devra le changer dès sa prochaine connexion.
              </p>
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || !resetPassword}
                className="flex-1 bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Enregistrement..." : "Réinitialiser le mot de passe"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-gray-500 hover:text-gray-800"
              >
                Fermer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showModal && !editingEmployee && (
        <Modal title="Ajouter un employé" onClose={closeModal}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom complet</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Nom et prénom"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="77 XXX XX XX"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="employe@boutique.com"
              />
              <p className="mt-1 text-xs text-gray-400">Sert d&apos;identifiant de connexion pour l&apos;employé.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe initial</label>
              <PasswordInput
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
                placeholder="6 caractères minimum"
              />
              <p className="mt-1 text-xs text-gray-400">
                Communiquez-le à l&apos;employé : il devra le changer dès sa première connexion.
              </p>
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Enregistrement..." : "Ajouter"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-gray-500 hover:text-gray-800"
              >
                Annuler
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
