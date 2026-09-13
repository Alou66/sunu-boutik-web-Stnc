"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import StockReceiptForm from "./StockReceiptForm";
import { fetchStockReceipt } from "./approvisionnements.api";
import { StockReceipt } from "./approvisionnements.types";

export default function EditApprovisionnementPage() {
  const params = useParams();
  const router = useRouter();
  const receiptId = Number(params.id);
  const [receipt, setReceipt] = useState<StockReceipt | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStockReceipt(receiptId)
      .then(setReceipt)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"));
  }, [receiptId]);

  function onSaved(updated: StockReceipt) {
    router.push(`/dashboard/approvisionnements/${updated.id}`);
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!receipt) return <p className="text-gray-400">Chargement...</p>;

  if (receipt.status !== "draft") {
    return <p className="text-sm text-red-600">Seul un approvisionnement en brouillon peut être modifié.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Modifier l&apos;approvisionnement {receipt.reference || `#${receipt.id}`}</h2>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline">
          ← Retour
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <StockReceiptForm receipt={receipt} onSaved={onSaved} />
      </div>
    </div>
  );
}
