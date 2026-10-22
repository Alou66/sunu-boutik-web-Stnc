export interface PendingInitialisationForm {
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  unit_target: "principale" | "secondaire";
  unit_label: string;
}

export interface PendingInitialisationListResponse {
  items: PendingInitialisationForm[];
  total: number;
}

export interface InitialisationLineInput {
  product_id: number;
  unit_target: "principale" | "secondaire";
  quantity?: number | null;
}

export interface InitialisationCreatePayload {
  lines: InitialisationLineInput[];
  note?: string | null;
}
