import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationResult,
    type UseQueryResult,
} from '@tanstack/react-query';
import axios, { type AxiosError } from 'axios';
import type { RequestModel } from '@/types/model';

type PublishingAnalytics = {
    for_publishing: number;
    published: number;
    total_contents: number;
    published_this_quarter: number;
    published_this_year: number;
    current_quarter: string;
    current_year: string;
};

type PublishingRequest = RequestModel;

type PaginatedResponse<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    analytics: PublishingAnalytics;
    quarters: string[];
    years: string[];
};

type Filters = {
    search: string;
    quarter: string;
    year: string;
};

type ApiResponse = {
    message: string;
};

export type PublishingApiError = {
    message?: string;
    error?: string;
};

export type PublishingPaginatedResponse = PaginatedResponse<PublishingRequest>;

export type { PublishingRequest };

export function useFetchPublishingRequests(
    page: number,
    filters: Filters,
): UseQueryResult<PublishingPaginatedResponse> {
    return useQuery<PublishingPaginatedResponse>({
        queryKey: ['publishing-requests', page, filters],
        queryFn: async () => {
            const response = await axios.get<PublishingPaginatedResponse>(
                '/publishing-requests',
                { params: { page, ...filters } },
            );

            return response.data;
        },
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });
}

export function usePublishRequest(): UseMutationResult<
    ApiResponse,
    AxiosError<PublishingApiError>,
    number
> {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse, AxiosError<PublishingApiError>, number>({
        mutationFn: (requestId) =>
            axios
                .post<ApiResponse>(`/publish-request/${requestId}`)
                .then((response) => response.data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['publishing-requests'],
            });
        },
    });
}

export function getPublishingErrorMessage(
    error: AxiosError<PublishingApiError>,
): string {
    return (
        error.response?.data?.message ??
        error.response?.data?.error ??
        'The content could not be published.'
    );
}
