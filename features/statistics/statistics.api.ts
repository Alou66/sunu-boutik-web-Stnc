import { api } from "@/lib/api";
import { Statistics } from "./statistics.types";

export function fetchStatistics(dateFrom: string, dateTo: string) {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
  return api.get<Statistics>(`/statistics?${params.toString()}`);
}
