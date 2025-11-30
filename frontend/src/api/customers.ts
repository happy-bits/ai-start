import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { Customer, CreateCustomerData, UpdateCustomerData } from './types';

// API functions
export async function getCustomers(): Promise<Customer[]> {
  const response = await apiClient.get<{ customers: Customer[] }>('/api/customers');
  return response.customers;
}

export async function getCustomer(id: number): Promise<Customer> {
  const response = await apiClient.get<{ customer: Customer }>(`/api/customers/${id}`);
  return response.customer;
}

export async function createCustomer(data: CreateCustomerData): Promise<Customer> {
  const response = await apiClient.post<{ customer: Customer }>('/api/customers', data);
  return response.customer;
}

export async function updateCustomer(id: number, data: UpdateCustomerData): Promise<Customer> {
  const response = await apiClient.put<{ customer: Customer }>(`/api/customers/${id}`, data);
  return response.customer;
}

export async function deleteCustomer(id: number): Promise<void> {
  await apiClient.delete(`/api/customers/${id}`);
}

// React Query hooks
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCustomerData }) =>
      updateCustomer(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

