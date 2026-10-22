"use client";

import { useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  useCreateStockInitialisation,
  usePendingInitialisations,
} from "./initialisation-stock.hooks";

type QuantityMap = Record<string, string>;

function formKey(p: { product_id: number; unit_target: string }) {
  return `${p.product_id}:${p.unit_target}`;
}

export default function InitialisationStockPage() {
  const { data, isLoading, isError, reload } = usePendingInitialisations() as any;
  const createMutation = useCreateStockInitialisation() as any;
  const [quantities, setQuantities] = useState<QuantityMap>({});
  const [error, setError] = useState<string>("");
  const [summary, setSummary] = useState<string>("");

  const items = useMemo(() => data?.items ?? [], [data]);

  function handleCancel() {
    setQuantities({});
    setError("");
    setSummary("");
  }

  function handleChange(key: string, value: string) {
    setQuantities((prev: QuantityMap) => ({ ...prev, [key]: value }));
    setError("");
    setSummary("");
  }

  async function handleSubmit() {
    setError("");
    setSummary("");
    const lines: Array<{ product_id: number; unit_target: "principale" | "secondaire"; quantity?: number }> = [];
    for (const item of items as any[]) {
      const key = formKey(item);
      const raw = quantities[key];
      if (raw === undefined || raw === null || raw === "") {
        continue;
      }
      const num = Number(raw);
      if (Number.isNaN(num)) {
        setError("Quantité invalide");
        return;
      }
      if (num === 0) {
        setError("la quantité doit être supérieure à zéro");
        return;
      }
      if (num <= 0) {
        setError("la quantité doit être supérieure à zéro");
        return;
      }
      lines.push({
        product_id: item.product_id,
        unit_target: item.unit_target,
        quantity: num,
      });
    }
    if (lines.length === 0) {
      setError("Aucune quantité valide fournie");
      return;
    }
    try {
      await createMutation.mutateAsync({ lines });
      setSummary(`${lines.length} forme(s) initialisée(s) avec succès`);
      setQuantities({});
      if (typeof reload === "function") {
        reload();
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erreur lors de l'initialisation du stock");
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Initialisation groupée du stock</h1>
        <p className="text-sm text-gray-500">Initialiser le stock de départ sans passer par le module Approvisionnement</p>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {summary && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{summary}</div>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Produit</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Catégorie</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Forme</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Quantité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                  Chargement...
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-red-600">
                  Erreur de chargement
                </td>
              </tr>
            )}
            {!isLoading && !isError && items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                  Aucune produit à initialiser
                </td>
              </tr>
            )}
            {items.map((item: any) => {
              const key = formKey(item);
              return (
                <tr key={key}>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.product_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.category_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.unit_label}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="w-40 rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={quantities[key] ?? ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder="Vide = ignoré"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={createMutation.isPending}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {createMutation.isPending ? "Initialisation..." : "Initialiser le stock"}
        </button>
      </div>
    </div>
  );
}
