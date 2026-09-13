"use client";

import { useRouter, useSearchParams } from "next/navigation";
import StockReceiptForm from "./StockReceiptForm";
import { StockReceipt } from "./approvisionnements.types";

export default function NewApprovisionnementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productIdParam = searchParams.get("product_id");
  const initialProductId = productIdParam ? Number(productIdParam) : undefined;

  function onSaved(receipt: StockReceipt) {
    router.push(`/dashboard/approvisionnements/${receipt.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Nouvel approvisionnement</h2>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline">
          ← Retour
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <StockReceiptForm onSaved={onSaved} initialProductId={initialProductId} />
      </div>
    </div>
  );
}
