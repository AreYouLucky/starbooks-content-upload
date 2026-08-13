import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BatchModel } from "@/types/model";
import axios from "axios";
import { AxiosError } from "axios";


type ForInitialReviewAnalytics = {
  for_initial_review: number;
  reviewed: number;
};

type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  analytics: ForInitialReviewAnalytics;
};

type ApiOk = { message: string; batch?: BatchModel; id?: number };
export type ApiValidationErrors = Record<string, string[]>;
export type ApiError = {
  message?: string;
  error?: string;
  errors?: ApiValidationErrors;
};

type Filters = {
  search: string | '';
  batch_id: number | '';
}
export function useFetchInitialReview(page: number,
  filters: Filters) {
  return useQuery<PaginatedResponse<BatchModel>>({
    queryKey: ["initial-review", page, filters],
    queryFn: async () => {
      const res = await axios.get("/initial-review-batches", {
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


export function useSubmitInitialReview() {
  const queryClient = useQueryClient();
  return useMutation<ApiOk, AxiosError<ApiError>, FormData>({
    mutationFn: (payload) =>
      axios.post<ApiOk>("/submit-initial-review", payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initial-review"] });
    },
  });
}

export function getInitialReviewErrorMessage(error: AxiosError<ApiError>): string {
  return error.response?.data?.message
    ?? error.response?.data?.error
    ?? "Failed to submit review. Please try again.";
}

export function useForwardToQualityApproval() {
  const queryClient = useQueryClient();
  return useMutation<ApiOk, AxiosError<ApiError>, { batchName: string }>({
    mutationFn: ({ batchName }) =>
      axios.post<ApiOk>("/forward-to-quality-assurance", { batchName }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initial-review"] });
    },
  });
}
