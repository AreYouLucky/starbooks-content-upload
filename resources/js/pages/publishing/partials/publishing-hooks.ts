import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import axios from 'axios';
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

export type PublishingPaginatedResponse =
    PaginatedResponse<PublishingBatch>;

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
