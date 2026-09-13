export type StockReceiptStatus = "draft" | "validated" | "cancelled";
export type UnitTarget = "principale" | "secondaire";

export interface StockReceiptLine {
  id: number;
  product_id: number;
  product_name: string;
  unit_target: UnitTarget;
  quantity: number;
  unit_cost: number;
}

export interface StockReceipt {
  id: number;
  supplier_id?: number | null;
  supplier_name?: string | null;
  reference?: string | null;
  status: StockReceiptStatus;
  total_cost: number;
  note?: string | null;
  created_by_id?: number | null;
  created_by_name?: string | null;
  validated_by_id?: number | null;
  validated_by_name?: string | null;
  validated_at?: string | null;
  created_at: string;
  lines: StockReceiptLine[];
}

export interface StockReceiptList {
  items: StockReceipt[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface StockReceiptLineInput {
  product_id: number;
  unit_target: UnitTarget;
  quantity: number;
  unit_cost: number | null;
}

export interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  source_type: string;
  source_id: number;
  unit_target: UnitTarget;
  quantity_delta: number;
  created_by_id?: number | null;
  created_by_name?: string | null;
  created_at: string;
}

export interface StockMovementList {
  items: StockMovement[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
