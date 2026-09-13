"use client";

import { FormEvent, useState } from "react";
import Modal from "@/components/Modal";
import SearchBar from "@/components/SearchBar";
import SkeletonRows from "@/components/SkeletonRows";
import { ApiError } from "@/lib/api";
import { Supplier } from "./suppliers.types";
import { createSupplier, deleteSupplier, updateSupplier } from "./suppliers.api";
import { useSuppliers } from "./suppliers.hooks";

const emptyForm = { name: "", phone: "", address: "", note: "" };

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { suppliers, total, totalPages, loading, error, setError, reload } = useSuppliers(page, search);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(s: Supplier) {
    setEditingId(s.id);
    setForm({ name: s.name, phone: s.phone || "", address: s.address || "", note: s.note || "" });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const name = form.name.trim();
    if (!name) {
      setFormError("Le nom du fournisseur est requis");
      return;
    }
    const payload = {
      name,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      note: form.note.trim() || null,
    };
    setSubmitting(true);
    try {
      if (editingId) {
        await updateSupplier(editingId, payload);
      } else {
        await createSupplier(payload);
        setPage(1);
      }
      closeModal();
      await reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Supprimer ce fournisseur ?")) return;
    try {
      await deleteSupplier(id);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Fournisseurs</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Ajouter fournisseur
        </button>
      </div>

      <SearchBar value={search} onChange={onSearchChange} placeholder="Rechercher un fournisseur..." />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Adresse</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows cols={4} />}
            {!loading && suppliers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">Aucun fournisseur</td>
              </tr>
            )}
            {suppliers.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{s.address || "—"}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline">
                    Modifier
                  </button>
                  <button onClick={() => onDelete(s.id)} className="text-red-600 hover:underline">
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
              {total} fournisseur{total > 1 ? "s" : ""} — page {page} / {totalPages}
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

      {showModal && (
        <Modal title={editingId ? "Modifier le fournisseur" : "Ajouter un fournisseur"} onClose={closeModal}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Nom du fournisseur"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Téléphone (optionnel)"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Adresse</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Adresse (optionnel)"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={2}
                placeholder="Note (optionnel)"
              />
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Enregistrement..." : editingId ? "Modifier" : "Ajouter"}
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
