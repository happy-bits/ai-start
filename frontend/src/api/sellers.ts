import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { CreateSellerData, Seller, UpdateSellerData } from './types';

// API functions
export async function getSellers(): Promise<Seller[]> {
  const response = await apiClient.get<{ sellers: Seller[] }>('/api/sellers');
  return response.sellers;
}

export async function getSeller(id: number): Promise<Seller> {
  const response = await apiClient.get<{ seller: Seller }>(`/api/sellers/${id}`);
  return response.seller;
}

export async function createSeller(data: CreateSellerData): Promise<Seller> {
  const response = await apiClient.post<{ seller: Seller }>('/api/sellers', data);
  return response.seller;
}

export async function updateSeller(id: number, data: UpdateSellerData): Promise<Seller> {
  const response = await apiClient.put<{ seller: Seller }>(`/api/sellers/${id}`, data);
  return response.seller;
}

export async function deleteSeller(id: number): Promise<void> {
  await apiClient.delete(`/api/sellers/${id}`);
}

// React Query hooks
export function useSellers() {
  return useQuery({
    queryKey: ['sellers'],
    queryFn: getSellers,
  });
}

export function useSeller(id: number) {
  return useQuery({
    queryKey: ['sellers', id],
    queryFn: () => getSeller(id),
    enabled: !!id,
  });
}

export function useCreateSeller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSeller,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
    },
  });
}

export function useUpdateSeller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSellerData }) => updateSeller(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      queryClient.invalidateQueries({ queryKey: ['sellers', id] });
    },
  });
}

export function useDeleteSeller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSeller,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
    },
  });
}
