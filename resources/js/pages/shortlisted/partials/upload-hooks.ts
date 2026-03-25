import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ApprovalRequestModel } from "@/types/model";
import axios from "axios";
import { AxiosError } from "axios";
type ApiOk = { status: string; approval_request?: ApprovalRequestModel; errors: undefined, id?: number };
type ApiValidationErrors = Record<string, string[]>;
type ApiError = {
    message?: string;
    errors?: ApiValidationErrors;
};
export const useUploadSingleRequest = () => {
    const queryClient = useQueryClient();
    return useMutation<ApiOk, AxiosError<ApiError>, FormData>({
        mutationFn: (payload) =>
            axios.post<ApiOk>("/single-upload", payload).then((res) => res.data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["requests"+res.id] });
        },
    });
}

export const useUpdateSingleRequest = () => {
    const queryClient = useQueryClient();
    return useMutation<ApiOk, AxiosError<ApiError>, {id: number; payload: FormData}>({
        mutationFn: (payload, id) =>
            axios.post<ApiOk>("/update-single-upload/"+id, payload).then((res) => res.data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["requests"+res.id] });
        },
    });
}