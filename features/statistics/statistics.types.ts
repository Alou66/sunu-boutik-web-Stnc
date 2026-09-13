export interface StockOverview {
  total_products: number;
  invested_capital: number;
  potential_sale_value: number;
  latent_margin: number;
  out_of_stock_count: number;
  low_stock_count: number;
}

export interface SalesPeriod {
  invoiced_total: number;
  collected_total: number;
  pending_total: number;
  real_profit: number;
  margin_rate: number;
  invoices_count: number;
}

export interface PurchasesPeriod {
  total_spent: number;
  receipts_count: number;
}

export interface DormantProduct {
  product_id: number;
  product_name: string;
  quantity: number;
  last_sale_at: string | null;
}

export interface Rankings {
  dormant_products: DormantProduct[];
}

export interface Statistics {
  date_from: string;
  date_to: string;
  stock: StockOverview;
  sales: SalesPeriod;
  purchases: PurchasesPeriod;
  rankings: Rankings;
}

export type PeriodPreset = "day" | "week" | "month" | "custom";
