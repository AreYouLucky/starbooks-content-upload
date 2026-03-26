import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ApprovalRequestModel } from "@/types/model";
import axios from "axios";
import { AxiosError } from "axios";
type ApiOk = { status: string; approval_request?: ApprovalRequestModel; errors: undefined, id?: number };
type ApiValidationErrors = Record<string, string[]>;
type ApiError = {
    message?: string;
    errors?: ApiValidationErrors;
    error?: string;
};
export const useUploadSingleRequest = () => {
    const queryClient = useQueryClient();
    return useMutation<ApiOk, AxiosError<ApiError>, FormData>({
        mutationFn: (payload) =>
            axios.post<ApiOk>("/single-upload", payload).then((res) => res.data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["requests"+res.approval_request?.id] });
        },
    });
}

export const useUpdateSingleRequest = () => {
    const queryClient = useQueryClient();
    return useMutation<ApiOk, AxiosError<ApiError>, {id: number; payload: FormData}>({
        mutationFn: ({id,payload}) =>
            axios.post<ApiOk>("/update-single-upload/"+id, payload).then((res) => res.data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["requests"+res.approval_request?.id] });
        },
    });
}

export const useDeleteSingleRequest = () => {
    const queryClient = useQueryClient();
    return useMutation<ApiOk, AxiosError<ApiError>, number>({
        mutationFn: (id) =>
            axios.delete<ApiOk>("/single-upload/"+id).then((res) => res.data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["requests"+res.approval_request?.id] });
        },
    });
}

export const useUploadBulkRequest = () => {
    const queryClient = useQueryClient();
    return useMutation<ApiOk, AxiosError<ApiError>, FormData>({
        mutationFn: (payload) =>
            axios.post<ApiOk>("/bulk-upload", payload).then((res) => res.data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["requests"+res.approval_request?.id] });
        },
    });
}