import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { type User } from '@/types';


type ApiOk = {
    status: string;
    user?: User;
    id?: number;
};

type ApiValidationErrors = Record<string, string>;
type ApiError = { message?: string; errors?: ApiValidationErrors };

export function useFetchUsers() {
    return useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await axios.get<User[]>('/users');
            return res.data;
        },
        staleTime: 1000 * 60,
        refetchOnWindowFocus: false,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation<ApiOk, AxiosError<ApiError>, FormData>({
        mutationFn: (payload) => axios.post<ApiOk>('/users', payload).then(res => res.data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation<ApiOk, AxiosError<ApiError>, { id: number; payload: FormData }>({
        mutationFn: ({ payload, id }) => axios.post<ApiOk>(`/update-user/${id}`, payload).then(res => res.data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation<ApiOk, AxiosError<ApiError>, { id: number }>({
        mutationFn: ({ id }) => axios.delete<ApiOk>(`/users/${id}`).then(res => res.data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

export function useChangeUserPassword() {
    return useMutation<ApiOk, AxiosError<ApiError>, { id: number; payload: FormData }>({
        mutationFn: ({ payload, id }) => axios.post<ApiOk>(`/change-user-password/${id}`, payload).then(res => res.data)
    });
}


