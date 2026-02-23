import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { Contact, CreateContactData, UpdateContactData } from './types';

// API functions
export async function getContacts(): Promise<Contact[]> {
  const response = await apiClient.get<{ contacts: Contact[] }>('/api/contacts');
  return response.contacts;
}

export async function getContact(id: number): Promise<Contact> {
  const response = await apiClient.get<{ contact: Contact }>(`/api/contacts/${id}`);
  return response.contact;
}

export async function createContact(data: CreateContactData): Promise<Contact> {
  const response = await apiClient.post<{ contact: Contact }>('/api/contacts', data);
  return response.contact;
}

export async function importContacts(contacts: CreateContactData[]): Promise<Contact[]> {
  const response = await apiClient.post<{ contacts: Contact[] }>('/api/contacts/import', {
    contacts,
  });
  return response.contacts;
}

export async function updateContact(id: number, data: UpdateContactData): Promise<Contact> {
  const response = await apiClient.put<{ contact: Contact }>(`/api/contacts/${id}`, data);
  return response.contact;
}

export async function deleteContact(id: number): Promise<void> {
  await apiClient.delete(`/api/contacts/${id}`);
}

export async function getWastebinContacts(): Promise<Contact[]> {
  const response = await apiClient.get<{ contacts: Contact[] }>('/api/contacts/wastebin');
  return response.contacts;
}

export async function restoreContact(id: number): Promise<Contact> {
  const response = await apiClient.post<{ contact: Contact }>(`/api/contacts/${id}/restore`);
  return response.contact;
}

export async function permanentlyDeleteContact(id: number): Promise<void> {
  await apiClient.delete(`/api/contacts/${id}/permanent`);
}

// React Query hooks
export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  });
}

export function useContact(id: number) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () => getContact(id),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useImportContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importContacts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateContactData }) => updateContact(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', id] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['wastebin'] });
    },
  });
}

export function useWastebinContacts() {
  return useQuery({
    queryKey: ['wastebin'],
    queryFn: getWastebinContacts,
  });
}

export function useRestoreContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreContact,
    onSuccess: (contact) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['wastebin'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', contact.id] });
    },
  });
}

export function usePermanentlyDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permanentlyDeleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wastebin'] });
    },
  });
}
