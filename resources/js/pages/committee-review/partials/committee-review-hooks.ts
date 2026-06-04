import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BatchModel } from "@/types/model";
import axios from "axios";
import { AxiosError } from "axios";


type ForCommitteeReviewAnalytics = {
  for_committee_review: number;
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
  analytics: ForCommitteeReviewAnalytics;
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
export function useFetchCommitteeReview(page: number,
  filters: Filters) {
  return useQuery<PaginatedResponse<BatchModel>>({
    queryKey: ["committee-review", page, filters],
    queryFn: async () => {
      const res = await axios.get("/committee-review-batches", {
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


export function useSubmitCommitteeReview() {
  const queryClient = useQueryClient();
  return useMutation<ApiOk, AxiosError<ApiError>, FormData>({
    mutationFn: (payload) =>
      axios.post<ApiOk>("/submit-committee-review", payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["committee-review"] });
    },
  });
}

export function getCommitteeReviewErrorMessage(error: AxiosError<ApiError>): string {
  return error.response?.data?.message
    ?? error.response?.data?.error
    ?? "Failed to submit review. Please try again.";
}
