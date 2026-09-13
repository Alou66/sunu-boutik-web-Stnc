"use client";

import { PeriodPreset } from "./statistics.types";

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function presetRange(preset: PeriodPreset): { from: string; to: string } {
  const today = new Date();
  const to = toDateStr(today);
  if (preset === "day") return { from: to, to };
  if (preset === "week") {
    const day = today.getDay() || 7; // dimanche=0 -> 7
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day - 1));
    return { from: toDateStr(monday), to };
  }
  if (preset === "month") {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toDateStr(first), to };
  }
  return { from: to, to }; // "custom" : valeur de départ, écrasée par les inputs date
}

interface Props {
  preset: PeriodPreset;
  dateFrom: string;
  dateTo: string;
  onPresetChange: (preset: PeriodPreset) => void;
  onCustomChange: (from: string, to: string) => void;
}

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: "day", label: "Jour" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
  { key: "custom", label: "Plage libre" },
];

export default function PeriodSelector({ preset, dateFrom, dateTo, onPresetChange, onCustomChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => onPresetChange(p.key)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
            preset === p.key
              ? "bg-blue-600 text-white border-blue-600"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {p.label}
        </button>
      ))}
      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            max={dateTo}
            onChange={(e) => onCustomChange(e.target.value, dateTo)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">→</span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            onChange={(e) => onCustomChange(dateFrom, e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}
