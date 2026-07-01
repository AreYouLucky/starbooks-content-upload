import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationResult,
    type UseQueryResult,
} from '@tanstack/react-query';
import axios, { type AxiosError } from 'axios';
import type { BatchModel } from '@/types/model';

type PublishingAnalytics = {
    for_publishing: number;
    published: number;
    total_batches: number;
};

type PublishingBatch = BatchModel & {
    records_count?: number;
};

type PaginatedResponse<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    analytics: PublishingAnalytics;
};

type Filters = {
    search: string;
};

type ApiResponse = {
    message: string;
};

export type PublishingApiError = {
    message?: string;
    error?: string;
};

type PublishBatchVariables = {
    batchName: string;
};

export type PublishingPaginatedResponse = PaginatedResponse<PublishingBatch>;

export type { PublishingBatch };

export function useFetchPublishingBatches(
    page: number,
    filters: Filters,
): UseQueryResult<PublishingPaginatedResponse> {
    return useQuery<PublishingPaginatedResponse>({
        queryKey: ['publishing-batches', page, filters],
        queryFn: async () => {
            const response = await axios.get<PublishingPaginatedResponse>(
                '/publishing-batches',
                { params: { page, ...filters } },
            );

            return response.data;
        },
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });
}

export function usePublishBatch(): UseMutationResult<
    ApiResponse,
    AxiosError<PublishingApiError>,
    PublishBatchVariables
> {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse,
        AxiosError<PublishingApiError>,
        PublishBatchVariables
    >({
        mutationFn: ({ batchName }) =>
            axios
                .post<ApiResponse>('/publish-batch', { batchName })
                .then((response) => response.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['publishing-batches'] });
        },
    });
}

export function getPublishingErrorMessage(
    error: AxiosError<PublishingApiError>,
): string {
    return (
        error.response?.data?.message ??
        error.response?.data?.error ??
        'The batch could not be published.'
    );
}
