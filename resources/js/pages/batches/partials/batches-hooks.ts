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

export function useFetchBatches() {
  return useQuery<BatchModel[]>({
    queryKey: ["batches"],
    queryFn: async () => {
      const res = await axios.get("/batches");
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