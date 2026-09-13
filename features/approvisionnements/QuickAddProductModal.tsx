"use client";

import { FormEvent, useState } from "react";
import Modal from "@/components/Modal";
import SearchSelect from "@/components/SearchSelect";
import { ApiError } from "@/lib/api";
import { useAllCategories } from "@/features/categories/categories.hooks";
import { Product } from "@/features/products/products.types";
import { createProduct } from "@/features/products/products.api";

// Création rapide d'un article directement depuis une ligne d'approvisionnement,
// pour le cas où le produit livré n'existe pas encore au catalogue.
export default function QuickAddProductModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (product: Product) => void;
}) {
  const { allCategories } = useAllCategories();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [unitPrice, setUnitPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [unit, setUnit] = useState("unite");
  const [isTransformable, setIsTransformable] = useState(false);
  const [unitPrincipale, setUnitPrincipale] = useState("");
  const [unitSecondaire, setUnitSecondaire] = useState("");
  const [conversionRatio, setConversionRatio] = useState("");
  const [unitPriceSecondaire, setUnitPriceSecondaire] = useState("");
  const [purchasePriceSecondaire, setPurchasePriceSecondaire] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const trimmedName = name.trim();
    const price = parseFloat(unitPrice);
    if (!trimmedName) {
      setError("Le nom de l'article est requis");
      return;
    }
    if (!categoryId) {
      setError("Choisissez une catégorie");
      return;
    }
    if (unitPrice === "" || Number.isNaN(price) || price < 0) {
      setError("Prix de vente invalide");
      return;
    }
    const cost = purchasePrice === "" ? 0 : parseFloat(purchasePrice);
    if (Number.isNaN(cost) || cost < 0) {
      setError("Prix d'achat invalide");
      return;
    }

    const payload: Record<string, unknown> = {
      name: trimmedName,
      category_id: categoryId,
      unit_price: price,
      purchase_price: cost,
      unit: unit.trim() || "unite",
      is_transformable: isTransformable,
    };

    if (isTransformable) {
      const principale = unitPrincipale.trim();
      const secondaire = unitSecondaire.trim();
      if (!principale) {
        setError("Le nom de la forme principale est requis (ex: carton)");
        return;
      }
      if (!secondaire) {
        setError("Le nom de la forme secondaire est requis (ex: seau)");
        return;
      }
      if (principale.toLowerCase() === secondaire.toLowerCase()) {
        setError("La forme principale et la forme secondaire doivent être différentes");
        return;
      }
      const ratio = parseFloat(conversionRatio);
      if (conversionRatio === "" || Number.isNaN(ratio) || ratio <= 0) {
        setError(`Indiquez combien de ${secondaire || "forme secondaire"} vaut 1 ${principale}`);
        return;
      }
      const priceSecondaire = parseFloat(unitPriceSecondaire);
      if (unitPriceSecondaire === "" || Number.isNaN(priceSecondaire) || priceSecondaire < 0) {
        setError(`Le prix unitaire de la forme secondaire (${secondaire}) est requis`);
        return;
      }
      let costSecondaire = 0;
      if (purchasePriceSecondaire !== "") {
        costSecondaire = parseFloat(purchasePriceSecondaire);
        if (Number.isNaN(costSecondaire) || costSecondaire < 0) {
          setError(`Le prix d'achat de la forme secondaire (${secondaire}) doit être un nombre positif`);
          return;
        }
      }
      payload.unit = principale;
      payload.unit_secondaire = secondaire;
      payload.conversion_ratio = ratio;
      payload.unit_price_secondaire = priceSecondaire;
      payload.purchase_price_secondaire = costSecondaire;
    }

    setSubmitting(true);
    try {
      const product = await createProduct(payload);
      onCreated(product);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la création de l'article");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Nouvel article" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Nom de l'article"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie</label>
          <SearchSelect
            options={allCategories.map((c) => ({ id: c.id, label: c.name }))}
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Choisir une catégorie..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prix de vente</label>
            <input
              type="number"
              step="1"
              min="0"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prix d&apos;achat</label>
            <input
              type="number"
              step="1"
              min="0"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="0"
            />
          </div>
        </div>
        {!isTransformable && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unité</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="unite"
            />
          </div>
        )}

        <p className="text-xs text-gray-400">
          L&apos;article démarre avec un stock à 0 ; la quantité de cette ligne l&apos;approvisionnera juste après sa création.
        </p>

        <div className="border-t pt-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={isTransformable}
              onChange={(e) => setIsTransformable(e.target.checked)}
              className="rounded border-gray-300"
            />
            Cet article est transformable
          </label>
          <p className="text-xs text-gray-400 mt-1">
            Ex: un carton de 5kg qui peut être détaché en plusieurs seaux.
          </p>

          {isTransformable && (
            <div className="mt-3 space-y-3 bg-gray-50 rounded-md p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Forme principale</label>
                  <input
                    type="text"
                    placeholder="Ex: carton"
                    value={unitPrincipale}
                    onChange={(e) => setUnitPrincipale(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Forme secondaire</label>
                  <input
                    type="text"
                    placeholder="Ex: seau"
                    value={unitSecondaire}
                    onChange={(e) => setUnitSecondaire(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  1 {unitPrincipale || "forme principale"} = combien de {unitSecondaire || "forme secondaire"} ?
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={conversionRatio}
                  onChange={(e) => setConversionRatio(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Ex: 4"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Prix de vente ({unitSecondaire || "forme secondaire"})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={unitPriceSecondaire}
                    onChange={(e) => setUnitPriceSecondaire(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Prix d&apos;achat ({unitSecondaire || "forme secondaire"})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={purchasePriceSecondaire}
                    onChange={(e) => setPurchasePriceSecondaire(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Création..." : "Créer l'article"}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-800">
            Annuler
          </button>
        </div>
      </form>
    </Modal>
  );
}
