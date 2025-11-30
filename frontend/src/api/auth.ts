import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { LoginCredentials, LoginResponse, User } from './types';

// API functions
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
  apiClient.setToken(response.token);
  return response;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
  apiClient.setToken(null);
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<{ user: User }>('/api/me');
  return response.user;
}

// React Query hooks
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: Infinity,
  });
}

