import { useMutation } from '@tanstack/react-query';
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
  return useMutation({
    mutationFn: login,
  });
}

