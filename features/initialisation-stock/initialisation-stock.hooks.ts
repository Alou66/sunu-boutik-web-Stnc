import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { PendingInitialisationListResponse } from "./initialisation-stock.types";
import { createStockInitialisation, listPendingInitialisations } from "./initialisation-stock.api";

export function usePendingInitialisations() {
  const [data, setData] = useState<PendingInitialisationListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await listPendingInitialisations();
      setData(res);
    } catch (err) {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, isLoading, isError, reload };
}

export function useCreateStockInitialisation() {
  const [isPending, setIsPending] = useState(false);
  const createMutation = {
    isPending,
    mutateAsync: async (payload: any) => {
      setIsPending(true);
      try {
        const res = await createStockInitialisation(payload);
        return res;
      } finally {
        setIsPending(false);
      }
    },
  };
  return createMutation;
}
