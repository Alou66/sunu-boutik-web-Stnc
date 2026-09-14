import { ProductForm } from "@/features/products/products.types";

export interface InvoiceLine {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  form?: ProductForm | null;
}

export type InvoiceStatus = "unpaid" | "partial" | "paid" | "cancelled";

export interface Invoice {
  id: number;
  number: string;
  client_id?: number | null;
  client_name?: string | null;
  total: number;
  amount_paid: number;
  balance_due: number;
  status: InvoiceStatus;
  note?: string | null;
  created_by_id?: number | null;
  created_by_name?: string | null;
  created_at: string;
  cancelled_at?: string | null;
  cancelled_by_id?: number | null;
  cancelled_by_name?: string | null;
  cancel_reason?: string | null;
  lines: InvoiceLine[];
}

export interface InvoiceList {
  items: Invoice[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  amount_received?: number | null;
  change?: number | null;
  note?: string | null;
  created_by_id?: number | null;
  created_by_name?: string | null;
  created_at: string;
  voided_at?: string | null;
  void_reason?: string | null;
  is_voided: boolean;
}

export type PdfFormat = "ticket" | "a4";
