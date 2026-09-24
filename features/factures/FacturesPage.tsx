"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import SkeletonRows from "@/components/SkeletonRows";
import { fetchAllClients } from "@/features/clients/clients.api";
import { fetchEmployeesLookup } from "@/features/employees/employees.api";
import { UserLookup } from "@/features/employees/employees.types";
import { ApiError } from "@/lib/api";
import InvoiceStatusBadge, { STATUS_LABELS } from "./InvoiceStatusBadge";
import { Invoice } from "./factures.types";
import { deleteInvoice } from "./factures.api";
import { useInvoices } from "./factures.hooks";

const PAGE_SIZE = 20;

export default function FacturesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const { invoices, total, totalPages, loading, error, reload } = useInvoices(
    page,
    PAGE_SIZE,
    search,
    date,
    statusFilter,
    employeeFilter
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [clientNamesById, setClientNamesById] = useState<Map<number, string>>(new Map());
  const [employees, setEmployees] = useState<UserLookup[]>([]);

  useEffect(() => {
    fetchAllClients()
      .then((clients) => setClientNamesById(new Map(clients.map((c) => [c.id, c.name]))))
      .catch(() => {
        // La colonne Client retombe alors sur "Client Divers" ; le reste de la page reste fonctionnel.
      });
    fetchEmployeesLookup()
      .then(setEmployees)
      .catch(() => {
        // Le filtre "par employé" reste alors simplement vide.
      });
  }, []);

  const clientLabel = useMemo(
    () => (inv: Invoice) => inv.client_name || (inv.client_id != null ? clientNamesById.get(inv.client_id) : undefined) || "Client Divers",
    [clientNamesById]
  );

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function onDateChange(value: string) {
    setDate(value);
    setPage(1);
  }

  function onStatusFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  function onEmployeeFilterChange(value: string) {
    setEmployeeFilter(value);
    setPage(1);
  }

  async function handleDelete(inv: Invoice) {
    if (!confirm(`Supprimer définitivement la facture ${inv.number} ? Cette action est irréversible.`)) return;
    setDeleteError("");
    setDeletingId(inv.id);
    try {
      await deleteInvoice(inv.id);
      reload();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-lg">Factures</h2>
        <div className="flex items-center gap-2 flex-wrap">
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
          <select
            value={employeeFilter}
            onChange={(e) => onEmployeeFilterChange(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les employés</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
          <button
            onClick={() => router.push("/dashboard/factures/new")}
            className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            + Nouvelle facture
          </button>
        </div>
      </div>

      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder="Rechercher une facture (numéro ou nom du client)..."
        maxWidthClassName="max-w-2xl"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Numéro</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Créé par</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows cols={7} />}
            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">Aucune facture</td>
              </tr>
            )}
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                onClick={() => router.push(`/dashboard/factures/${inv.id}`)}
                className="border-t cursor-pointer hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium">{inv.number}</td>
                <td className="px-4 py-3 text-gray-700">{clientLabel(inv)}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(inv.created_at).toLocaleString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-gray-700">{inv.created_by_name || "—"}</td>
                <td className="px-4 py-3">
                  <InvoiceStatusBadge status={inv.status} />
                </td>
                <td className="px-4 py-3 text-right">{inv.total.toLocaleString()} FCFA</td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  {inv.status === "cancelled" ? (
                    <button
                      onClick={() => handleDelete(inv)}
                      disabled={deletingId === inv.id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === inv.id ? "Suppression..." : "Supprimer"}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push(`/dashboard/factures/${inv.id}/edit`)}
                      className="text-blue-600 hover:underline"
                    >
                      Modifier
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {total} facture{total > 1 ? "s" : ""} — page {page} / {totalPages}
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
