"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SkeletonRows from "@/components/SkeletonRows";
import SearchSelect from "@/components/SearchSelect";
import { useAllSuppliers } from "@/features/suppliers/suppliers.hooks";
import StockReceiptStatusBadge, { STATUS_LABELS } from "./StockReceiptStatusBadge";
import { useStockReceipts } from "./approvisionnements.hooks";

export default function ApprovisionnementsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const { receipts, total, totalPages, loading, error } = useStockReceipts(page, statusFilter, supplierId, date);
  const { allSuppliers } = useAllSuppliers();

  function onStatusFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  function onSupplierChange(value: number | "") {
    setSupplierId(value);
    setPage(1);
  }

  function onDateChange(value: string) {
    setDate(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Approvisionnements</h1>
        <button
          onClick={() => router.push("/dashboard/approvisionnements/new")}
          className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Nouvel approvisionnement
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {date && (
          <button onClick={() => onDateChange("")} className="text-sm text-gray-500 hover:underline">
            Effacer
          </button>
        )}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <div className="w-56">
          <SearchSelect
            options={allSuppliers.map((s) => ({ id: s.id, label: s.name }))}
            value={supplierId}
            onChange={onSupplierChange}
            placeholder="Tous les fournisseurs"
            allowEmpty
            emptyLabel="Tous les fournisseurs"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Référence</th>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Coût total</th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows cols={5} />}
            {!loading && receipts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">Aucun approvisionnement</td>
              </tr>
            )}
            {receipts.map((r) => (
              <tr
                key={r.id}
                onClick={() => router.push(`/dashboard/approvisionnements/${r.id}`)}
                className="border-t cursor-pointer hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium">{r.reference || `#${r.id}`}</td>
                <td className="px-4 py-3 text-gray-700">{r.supplier_name || "Fournisseur Divers"}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(r.created_at).toLocaleString("fr-FR")}</td>
                <td className="px-4 py-3">
                  <StockReceiptStatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-right">{r.total_cost.toLocaleString()} FCFA</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {total} approvisionnement{total > 1 ? "s" : ""} — page {page} / {totalPages}
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
    </div>
  );
}
