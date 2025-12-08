import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { Interaction, CreateInteractionData, UpdateInteractionData } from './types';

// API functions
export async function getInteractions(contactId?: number): Promise<Interaction[]> {
  const url = contactId
    ? `/api/interactions?contactId=${contactId}`
    : '/api/interactions';
  const response = await apiClient.get<{ interactions: Interaction[] }>(url);
  return response.interactions;
}

export async function getInteraction(id: number): Promise<Interaction> {
  const response = await apiClient.get<{ interaction: Interaction }>(`/api/interactions/${id}`);
  return response.interaction;
}

export async function createInteraction(data: CreateInteractionData): Promise<Interaction> {
  const response = await apiClient.post<{ interaction: Interaction }>('/api/interactions', data);
  return response.interaction;
}

export async function updateInteraction(id: number, data: UpdateInteractionData): Promise<Interaction> {
  const response = await apiClient.put<{ interaction: Interaction }>(`/api/interactions/${id}`, data);
  return response.interaction;
}

export async function deleteInteraction(id: number): Promise<void> {
  await apiClient.delete(`/api/interactions/${id}`);
}

// React Query hooks
export function useInteractions(contactId?: number) {
  return useQuery({
    queryKey: ['interactions', { contactId }],
    queryFn: () => getInteractions(contactId),
  });
}

export function useInteraction(id: number) {
  return useQuery({
    queryKey: ['interactions', id],
    queryFn: () => getInteraction(id),
    enabled: !!id,
  });
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInteraction,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['interactions', { contactId: data.contactId }] });
    },
  });
}

export function useUpdateInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInteractionData }) =>
      updateInteraction(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['interactions', id] });
    },
  });
}

export function useDeleteInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInteraction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
  });
}

