"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import SearchBar from "@/components/SearchBar";
import SearchSelect from "@/components/SearchSelect";
import { IconChart } from "@/components/Icons";
import SkeletonRows from "@/components/SkeletonRows";
import { ApiError } from "@/lib/api";
import { Category } from "@/features/categories/categories.types";
import { useAllCategories } from "@/features/categories/categories.hooks";
import { Product } from "./products.types";
import { createProduct, deleteProduct, updateProduct } from "./products.api";
import { useAllProducts, useProducts } from "./products.hooks";

const emptyForm = {
  name: "",
  category_id: "" as number | "",
  unit_price: "",
  purchase_price: "",
  is_transformable: false,
  unit_principale: "",
  unit_secondaire: "",
  conversion_ratio: "",
  unit_price_secondaire: "",
  purchase_price_secondaire: "",
};

export default function ArticlesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { products, total, totalPages, loading, error, setError, reload } = useProducts(page, search);
  const { allProducts, reload: reloadAllProducts } = useAllProducts();
  const { allCategories: categories } = useAllCategories();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingQuantitySecondaire, setEditingQuantitySecondaire] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function openCreate() {
    setEditingId(null);
    setEditingProduct(null);
    setForm(emptyForm);
    setEditingQuantitySecondaire(0);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setEditingProduct(p);
    setForm({
      name: p.name,
      category_id: p.category_id,
      unit_price: String(p.unit_price),
      purchase_price: String(p.purchase_price),
      is_transformable: p.is_transformable,
      unit_principale: p.is_transformable ? p.unit : "",
      unit_secondaire: p.unit_secondaire || "",
      conversion_ratio: p.conversion_ratio != null ? String(p.conversion_ratio) : "",
      unit_price_secondaire: p.unit_price_secondaire != null ? String(p.unit_price_secondaire) : "",
      purchase_price_secondaire: p.purchase_price_secondaire != null ? String(p.purchase_price_secondaire) : "",
    });
    setEditingQuantitySecondaire(p.quantity_secondaire);
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setFormError("Le nom de l'article est requis");
      return;
    }
    if (!form.category_id) {
      setFormError("Choisissez une catégorie");
      return;
    }
    const unitPrice = parseFloat(form.unit_price);
    if (form.unit_price === "" || Number.isNaN(unitPrice) || unitPrice < 0) {
      setFormError("Le prix unitaire doit être un nombre positif");
      return;
    }
    let purchasePrice = 0;
    if (form.purchase_price !== "") {
      purchasePrice = parseFloat(form.purchase_price);
      if (Number.isNaN(purchasePrice) || purchasePrice < 0) {
        setFormError("Le prix d'achat doit être un nombre positif");
        return;
      }
    }
    const payload: Record<string, unknown> = {
      name: trimmedName,
      category_id: Number(form.category_id),
      unit_price: unitPrice,
      purchase_price: purchasePrice,
      is_transformable: form.is_transformable,
    };

    if (form.is_transformable) {
      const unitPrincipale = form.unit_principale.trim();
      const unitSecondaire = form.unit_secondaire.trim();
      if (!unitPrincipale) {
        setFormError("Le nom de la forme principale est requis (ex: carton)");
        return;
      }
      if (!unitSecondaire) {
        setFormError("Le nom de la forme secondaire est requis (ex: seau)");
        return;
      }
      if (unitPrincipale.toLowerCase() === unitSecondaire.toLowerCase()) {
        setFormError("La forme principale et la forme secondaire doivent être différentes");
        return;
      }
      const ratio = parseFloat(form.conversion_ratio);
      if (form.conversion_ratio === "" || Number.isNaN(ratio) || ratio <= 0) {
        setFormError(`Indiquez combien de ${unitSecondaire || "forme secondaire"} vaut 1 ${unitPrincipale}`);
        return;
      }
      const priceSecondaire = parseFloat(form.unit_price_secondaire);
      if (form.unit_price_secondaire === "" || Number.isNaN(priceSecondaire) || priceSecondaire < 0) {
        setFormError(`Le prix unitaire de la forme secondaire (${unitSecondaire}) est requis`);
        return;
      }
      let purchasePriceSecondaire = 0;
      if (form.purchase_price_secondaire !== "") {
        purchasePriceSecondaire = parseFloat(form.purchase_price_secondaire);
        if (Number.isNaN(purchasePriceSecondaire) || purchasePriceSecondaire < 0) {
          setFormError(`Le prix d'achat de la forme secondaire (${unitSecondaire}) doit être un nombre positif`);
          return;
        }
      }
      payload.unit = unitPrincipale;
      payload.unit_secondaire = unitSecondaire;
      payload.conversion_ratio = ratio;
      payload.unit_price_secondaire = priceSecondaire;
      payload.purchase_price_secondaire = purchasePriceSecondaire;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
        setPage(1);
      }
      closeModal();
      await reload();
      reloadAllProducts();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Supprimer cet article ?")) return;
    try {
      await deleteProduct(id);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Articles</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link
            href="/dashboard/statistiques"
            className="flex items-center gap-2 border border-gray-300 rounded-md px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <IconChart className="w-4 h-4" />
            Statistiques
          </Link>
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            + Ajouter article
          </button>
        </div>
      </div>

      <SearchBar value={search} onChange={onSearchChange} placeholder="Rechercher un article..." />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3 text-right">Prix unitaire</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows cols={5} />}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">Aucun article</td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3 font-medium">
                  {p.name}
                  {p.is_transformable && (
                    <span className="ml-2 inline-block text-[10px] uppercase tracking-wide bg-blue-50 text-blue-600 rounded px-1.5 py-0.5 align-middle">
                      Transformable
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{p.category_name}</td>
                <td className="px-4 py-3 text-right">
                  {p.unit_price.toLocaleString()} FCFA
                  {p.is_transformable && (
                    <span className="block text-xs text-gray-400">
                      {p.unit_price_secondaire?.toLocaleString()} FCFA / {p.unit_secondaire}
                    </span>
                  )}
                </td>
                <td className={`px-4 py-3 text-right ${p.quantity <= 0 ? "text-red-600 font-semibold" : ""}`}>
                  {p.quantity} {p.is_transformable ? p.unit : ""}
                  {p.is_transformable && (
                    <span className="block text-xs text-gray-400 font-normal">
                      {p.quantity_secondaire} {p.unit_secondaire}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                  <Link href={`/dashboard/approvisionnements/new?product_id=${p.id}`} className="text-green-600 hover:underline">
                    Approvisionner
                  </Link>
                  <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline">
                    Modifier
                  </button>
                  <button onClick={() => onDelete(p.id)} className="text-red-600 hover:underline">
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
              {total} article{total > 1 ? "s" : ""} — page {page} / {totalPages}
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
        <Modal title={editingId ? "Modifier l'article" : "Ajouter un article"} onClose={closeModal}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
              <SearchSelect
                options={allProducts
                  .filter((p) => p.id !== editingId)
                  .map((p) => ({ id: p.id, label: p.name }))}
                allowFreeText
                freeTextValue={form.name}
                onFreeTextChange={(text) => setForm((f) => ({ ...f, name: text }))}
                placeholder="Nom de l'article"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie</label>
              {categories.length === 0 ? (
                <p className="text-xs text-amber-600">
                  Aucune catégorie pour l&apos;instant. Créez-en une dans l&apos;onglet Catégories avant
                  d&apos;ajouter un article.
                </p>
              ) : (
                <SearchSelect
                  options={categories.map((c: Category) => ({ id: c.id, label: c.name }))}
                  value={form.category_id}
                  onChange={(id) => setForm({ ...form, category_id: id })}
                  placeholder="Rechercher une catégorie..."
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prix de vente</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prix d&apos;achat</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={form.purchase_price}
                  onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="0"
                />
                <p className="text-[11px] text-gray-400 mt-1">Ce que vous payez au fournisseur (sert de coût par défaut à l&apos;approvisionnement)</p>
              </div>
            </div>

            {editingProduct ? (
              <div className="bg-gray-50 rounded-md px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Stock actuel</p>
                  <p className="text-sm font-medium">
                    {editingProduct.quantity} {editingProduct.is_transformable ? editingProduct.unit : ""}
                    {editingProduct.is_transformable && (
                      <span className="text-gray-400"> / {editingProduct.quantity_secondaire} {editingProduct.unit_secondaire}</span>
                    )}
                  </p>
                </div>
                <Link
                  href={`/dashboard/approvisionnements/new?product_id=${editingProduct.id}`}
                  className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                >
                  Approvisionner
                </Link>
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                L&apos;article démarre avec un stock à 0. Utilisez le module Approvisionnement pour le recevoir en stock.
              </p>
            )}

            <div className="border-t pt-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_transformable}
                  onChange={(e) => setForm({ ...form, is_transformable: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Cet article est transformable
              </label>
              <p className="text-xs text-gray-400 mt-1">
                Ex: un carton de 5kg qui peut être détaché en plusieurs seaux.
              </p>
              {!form.is_transformable && editingQuantitySecondaire > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Il reste {editingQuantitySecondaire} unité(s) en forme secondaire pour cet article : elles
                  doivent d&apos;abord être retransformées (page Transformations) avant de pouvoir désactiver
                  cette option.
                </p>
              )}

              {form.is_transformable && (
                <div className="mt-3 space-y-3 bg-gray-50 rounded-md p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Forme principale</label>
                      <input
                        type="text"
                        placeholder="Ex: carton"
                        value={form.unit_principale}
                        onChange={(e) => setForm({ ...form, unit_principale: e.target.value })}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Forme secondaire</label>
                      <input
                        type="text"
                        placeholder="Ex: seau"
                        value={form.unit_secondaire}
                        onChange={(e) => setForm({ ...form, unit_secondaire: e.target.value })}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      1 {form.unit_principale || "forme principale"} = combien de {form.unit_secondaire || "forme secondaire"} ?
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.conversion_ratio}
                      onChange={(e) => setForm({ ...form, conversion_ratio: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder="Ex: 4"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Prix de vente ({form.unit_secondaire || "forme secondaire"})
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={form.unit_price_secondaire}
                        onChange={(e) => setForm({ ...form, unit_price_secondaire: e.target.value })}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Prix d&apos;achat ({form.unit_secondaire || "forme secondaire"})
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={form.purchase_price_secondaire}
                        onChange={(e) => setForm({ ...form, purchase_price_secondaire: e.target.value })}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}
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
