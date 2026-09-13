"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import StockReceiptStatusBadge from "./StockReceiptStatusBadge";
import { cancelStockReceipt, deleteStockReceipt, fetchStockReceipt, validateStockReceipt } from "./approvisionnements.api";
import { StockReceipt } from "./approvisionnements.types";

export default function ApprovisionnementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const receiptId = Number(params.id);
  const [receipt, setReceipt] = useState<StockReceipt | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    fetchStockReceipt(receiptId)
      .then(setReceipt)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"));
  }

  useEffect(load, [receiptId]);

  async function onValidate() {
    if (!confirm("Valider cet approvisionnement ? Le stock des articles sera immédiatement mis à jour.")) return;
    setBusy(true);
    setActionError("");
    try {
      const updated = await validateStockReceipt(receiptId);
      setReceipt(updated);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erreur lors de la validation");
    } finally {
      setBusy(false);
    }
  }

  async function onCancel() {
    if (!confirm("Annuler cet approvisionnement ? Le stock déjà crédité sera repris.")) return;
    setBusy(true);
    setActionError("");
    try {
      const updated = await cancelStockReceipt(receiptId);
      setReceipt(updated);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erreur lors de l'annulation");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm("Supprimer définitivement ce brouillon ?")) return;
    setBusy(true);
    setActionError("");
    try {
      await deleteStockReceipt(receiptId);
      router.push("/dashboard/approvisionnements");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erreur lors de la suppression");
      setBusy(false);
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!receipt) return <p className="text-gray-400">Chargement...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-lg">Approvisionnement {receipt.reference || `#${receipt.id}`}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/dashboard/approvisionnements")} className="text-sm text-gray-500 hover:underline">
            ← Retour
          </button>
          {receipt.status === "draft" && (
            <>
              <button
                onClick={() => router.push(`/dashboard/approvisionnements/${receipt.id}/edit`)}
                className="border border-gray-300 rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Modifier
              </button>
              <button
                onClick={onDelete}
                disabled={busy}
                className="border border-red-300 text-red-600 rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                Supprimer
              </button>
              <button
                onClick={onValidate}
                disabled={busy}
                className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Valider
              </button>
            </>
          )}
          {receipt.status === "validated" && (
            <button
              onClick={onCancel}
              disabled={busy}
              className="border border-red-300 text-red-600 rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              Annuler l&apos;approvisionnement
            </button>
          )}
        </div>
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <div className="bg-white rounded-xl shadow p-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Statut</p>
            <StockReceiptStatusBadge status={receipt.status} />
          </div>
          <div>
            <p className="text-gray-500">Fournisseur</p>
            <p className="font-medium">{receipt.supplier_name || "Fournisseur Divers"}</p>
          </div>
          <div>
            <p className="text-gray-500">Créé par</p>
            <p className="font-medium">{receipt.created_by_name || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium">{new Date(receipt.created_at).toLocaleString("fr-FR")}</p>
          </div>
          {receipt.status !== "draft" && (
            <>
              <div>
                <p className="text-gray-500">Validé par</p>
                <p className="font-medium">{receipt.validated_by_name || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Validé le</p>
                <p className="font-medium">{receipt.validated_at ? new Date(receipt.validated_at).toLocaleString("fr-FR") : "—"}</p>
              </div>
            </>
          )}
        </div>

        {receipt.note && (
          <div className="text-sm">
            <p className="text-gray-500">Note</p>
            <p>{receipt.note}</p>
          </div>
        )}

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-3 py-2">Article</th>
                <th className="px-3 py-2">Forme</th>
                <th className="px-3 py-2 text-right">Quantité</th>
                <th className="px-3 py-2 text-right">Coût unitaire</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {receipt.lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-3 py-2 font-medium">{line.product_name}</td>
                  <td className="px-3 py-2 text-gray-500">{line.unit_target === "secondaire" ? "Secondaire" : "Principale"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{line.quantity}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{line.unit_cost.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">
                    {(line.unit_cost * line.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t pt-4">
          <p className="font-semibold text-xl tabular-nums">Coût total : {receipt.total_cost.toLocaleString()} FCFA</p>
        </div>
      </div>
    </div>
  );
}
