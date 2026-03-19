import { useQuery } from "@tanstack/react-query";
import { BatchModel } from "@/types/model";
import axios from "axios";
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