export interface Supplier {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  note?: string | null;
  created_at: string;
}

export interface SupplierList {
  items: Supplier[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
