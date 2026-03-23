import { useQuery } from "@tanstack/react-query";
import { ApprovalRequestModel } from "@/types/model";
import axios from "axios";

type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
};

type ApiOk = { status: string; batch?: ApprovalRequestModel; errors: undefined, id?: number };
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
  return useQuery<PaginatedResponse<ApprovalRequestModel>>({
    queryKey: ["shortlisted", page, filters],
    queryFn: async () => {
      const res = await axios.get("/shortlisted", {
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