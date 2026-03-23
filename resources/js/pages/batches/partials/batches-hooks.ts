import { useQuery, useMutation } from "@tanstack/react-query";
import { BatchModel } from "@/types/model";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

type ApiOk = { status: string; batch?: BatchModel; errors: undefined, id?: number };
type ApiValidationErrors = Record<string, string[]>;
type ApiError = {
  message?: string;
  errors?: ApiValidationErrors;
};

type batchFilters = {
  search: string | '';
}
type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
};

export function useFetchBatches(page: number,
  filters: batchFilters) {
  return useQuery<PaginatedResponse<BatchModel>>({
    queryKey: ["batches", page, filters],
    queryFn: async () => {
      const res = await axios.get("/batches", {
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

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation<ApiOk, AxiosError<ApiError>, FormData>({
    mutationFn: (payload) =>
      axios.post<ApiOk>("/batches", payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });
}

export function useUpdateBatch() {
  const queryClient = useQueryClient();
  return useMutation<ApiOk, AxiosError<ApiError>,  { id: number; payload: FormData }>({
    mutationFn: ({id,payload}) =>
      axios.post<ApiOk>(`/update-batch/${id}`, payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
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