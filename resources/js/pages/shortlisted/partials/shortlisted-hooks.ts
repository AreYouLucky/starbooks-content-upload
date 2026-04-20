import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { BatchModel, ApprovalRequestModel } from "@/types/model";
import axios from "axios";
import { AxiosError } from "axios";
import { use } from "react";

type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
};

type ApiOk = { status: string; batch?: BatchModel; errors: undefined, id?: number };
type ApiValidationErrors = Record<string, string[]>;
type ApiError = {
  message?: string;
  errors?: ApiValidationErrors;
};

type filters = {
  search: string | '';
  batch_id: number | '';
}

export function useFetchShortlisted(page: number,
  filters: filters) {
  return useQuery<PaginatedResponse<BatchModel>>({
    queryKey: ["shortlisted", page, filters],
    queryFn: async () => {
      const res = await axios.get("/shortlist", {
        params: {
          page,
          ...filters,
        }
      });
      return res.data;
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false
  });
}


export function useToggleBatchShortlist() {
  const queryClient = useQueryClient();
  return useMutation<ApiOk, AxiosError<ApiError>, number>({
    mutationFn: (id) =>
      axios.post<ApiOk>(`/toggle-batch-shortlist/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });
}