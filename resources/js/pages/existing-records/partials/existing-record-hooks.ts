import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import type { RecordModel } from '@/types/model';

type ApiOk = {
    status: string;
    record?: RecordModel;
};

type ApiValidationErrors = Record<string, string[]>;

type ApiError = {
    message?: string;
    errors?: ApiValidationErrors;
};

export const useUpdateExistingRecord = () => {
    const queryClient = useQueryClient();

    return useMutation<
        ApiOk,
        AxiosError<ApiError>,
        { id: number; status: string; payload: FormData }
    >({
        mutationFn: ({ id, status, payload }) =>
            axios
                .post<ApiOk>(`/existing-records/${status}/${id}`, payload)
                .then((res) => res.data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({
                queryKey: ['existing-records', res.record?.id],
            });
        },
    });
};

export const useUnpublishRecord = () => {
    const queryClient = useQueryClient();

    return useMutation<ApiOk, AxiosError<ApiError>, number>({
        mutationFn: (id) =>
            axios
                .post<ApiOk>(`/existing-records/${id}/unpublish`)
                .then((res) => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['existing-records'] });
        },
    });
};

export const useRepublishRecord = () => {
    const queryClient = useQueryClient();

    return useMutation<ApiOk, AxiosError<ApiError>, number>({
        mutationFn: (id) =>
            axios
                .post<ApiOk>(`/archived-records/${id}/republish`)
                .then((res) => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['existing-records'] });
        },
    });
};
