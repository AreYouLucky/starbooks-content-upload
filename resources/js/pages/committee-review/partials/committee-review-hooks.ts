import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { BatchModel, ApprovalRequestModel } from "@/types/model";
import axios from "axios";
import { AxiosError } from "axios";
import { use } from "react";

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
export function useFetchCommitteeReview(page: number,
  filters: filters) {
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