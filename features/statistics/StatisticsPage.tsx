"use client";

import { useState } from "react";
import StatCard from "@/components/StatCard";
import PeriodSelector, { presetRange } from "./PeriodSelector";
import { useStatistics } from "./statistics.hooks";
import { PeriodPreset } from "./statistics.types";

function fcfa(value: number): string {
  return `${Math.round(value).toLocaleString("fr-FR")} FCFA`;
}

export default function StatisticsPage() {
  const [preset, setPreset] = useState<PeriodPreset>("month");
  const initial = presetRange("month");
  const [dateFrom, setDateFrom] = useState(initial.from);
  const [dateTo, setDateTo] = useState(initial.to);

  const { stats, loading, error } = useStatistics(dateFrom, dateTo);

  function handlePresetChange(next: PeriodPreset) {
    setPreset(next);
    if (next !== "custom") {
      const range = presetRange(next);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  }

  function handleCustomChange(from: string, to: string) {
    setDateFrom(from);
    setDateTo(to);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Statistiques</h1>
        <PeriodSelector
          preset={preset}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onPresetChange={handlePresetChange}
          onCustomChange={handleCustomChange}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-gray-400 text-sm">Chargement...</p>}

      {!loading && stats && (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500">Stock actuel</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Articles" value={stats.stock.total_products} />
              <StatCard label="Capital investi" value={fcfa(stats.stock.invested_capital)} />
              <StatCard label="Valeur de vente potentielle" value={fcfa(stats.stock.potential_sale_value)} />
              <StatCard label="Marge latente" value={fcfa(stats.stock.latent_margin)} />
              <StatCard
                label="Rupture de stock"
                value={stats.stock.out_of_stock_count}
                highlight={stats.stock.out_of_stock_count > 0}
              />
              <StatCard
                label="Stock bas (< 5)"
                value={stats.stock.low_stock_count}
                highlight={stats.stock.low_stock_count > 0}
              />
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500">Ventes de la période</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Factures" value={stats.sales.invoices_count} />
              <StatCard label="CA facturé" value={fcfa(stats.sales.invoiced_total)} />
              <StatCard label="Encaissé réel" value={fcfa(stats.sales.collected_total)} />
              <StatCard
                label="En attente"
                value={fcfa(stats.sales.pending_total)}
                highlight={stats.sales.pending_total > 0}
              />
              <StatCard label="Bénéfice réel" value={fcfa(stats.sales.real_profit)} />
              <StatCard label="Taux de marge" value={`${stats.sales.margin_rate.toFixed(1)} %`} />
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500">Achats de la période</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Total dépensé" value={fcfa(stats.purchases.total_spent)} />
              <StatCard label="Réceptions" value={stats.purchases.receipts_count} />
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500">Articles dormants (aucune vente depuis 30 jours)</h2>
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-gray-50 text-gray-600 text-left">
                  <tr>
                    <th className="px-4 py-3">Article</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-4 py-3 text-right">Dernière vente</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.rankings.dormant_products.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                        Aucun article dormant
                      </td>
                    </tr>
                  )}
                  {stats.rankings.dormant_products.map((p) => (
                    <tr key={p.product_id} className="border-t">
                      <td className="px-4 py-3 font-medium">{p.product_name}</td>
                      <td className="px-4 py-3 text-right">{p.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {p.last_sale_at ? new Date(p.last_sale_at).toLocaleDateString("fr-FR") : "Jamais vendu"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
