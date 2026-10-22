import { api } from "@/lib/api";
import {
  InitialisationCreatePayload,
  PendingInitialisationListResponse,
} from "./initialisation-stock.types";

export function listPendingInitialisations() {
  return api.get<PendingInitialisationListResponse>("/stock-initializations/pending");
}

export function createStockInitialisation(payload: InitialisationCreatePayload) {
  return api.post("/stock-initializations", payload);
}
