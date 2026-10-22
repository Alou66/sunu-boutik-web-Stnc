import { api } from "@/lib/api";

export function createStockAdjustment(payload: {
  product_id: number;
  unit_target: "principale" | "secondaire";
  adjustment_type: "entry" | "exit";
  quantity: number;
  reason: string;
}) {
  return api.post("/stock-adjustments", payload);
}
