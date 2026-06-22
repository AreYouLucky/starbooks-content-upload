import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { type AxiosError } from 'axios';
import type { BatchModel } from '@/types/model';

type QualityAssuranceAnalytics = {
    for_quality_assurance: number;
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
    analytics: QualityAssuranceAnalytics;
};

type Filters = {
    search: string;
    batch_id: number | '';
};

type ApiResponse = {
    message: string;
};

export type QualityAssuranceValidationErrors = Record<string, string[]>;

export type QualityAssuranceApiError = {
    message?: string;
    error?: string;
    errors?: QualityAssuranceValidationErrors;
};

export function useFetchQualityAssurance(page: number, filters: Filters) {
    return useQuery<PaginatedResponse<BatchModel>>({
        queryKey: ['quality-assurance', page, filters],
        queryFn: async () => {
            const response = await axios.get<PaginatedResponse<BatchModel>>(
                '/quality-assurance-batches',
                { params: { page, ...filters } },
            );

            return response.data;
        },
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });
}

export function useSubmitQualityAssuranceReview() {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse,
        AxiosError<QualityAssuranceApiError>,
        FormData
    >({
        mutationFn: (payload) =>
            axios
                .post<ApiResponse>('/submit-quality-assurance-review', payload)
                .then((response) => response.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quality-assurance'] });
        },
    });
}

export function useForwardToPublishing() {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse,
        AxiosError<QualityAssuranceApiError>,
        { batchName: string }
    >({
        mutationFn: ({ batchName }) =>
            axios
                .post<ApiResponse>('/forward-to-publishing', { batchName })
                .then((response) => response.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quality-assurance'] });
        },
    });
}

export function getQualityAssuranceErrorMessage(
    error: AxiosError<QualityAssuranceApiError>,
): string {
    return (
        error.response?.data?.message ??
        error.response?.data?.error ??
        'The quality assurance request could not be completed.'
    );
}
