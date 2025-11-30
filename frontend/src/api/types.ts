// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'seller';
  createdAt?: string;
  updatedAt?: string;
}

// Contact types
export interface Contact {
  id: number;
  sellerId: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactData {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  followUpDate?: string | null;
}

export interface UpdateContactData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  followUpDate?: string | null;
}

// Interaction types
export type InteractionType = 'call' | 'meeting' | 'email';

export interface InteractionTypeOption {
  value: InteractionType;
  label: string;
}

export const INTERACTION_TYPE_OPTIONS: InteractionTypeOption[] = [
  { value: 'call', label: 'Phone Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'email', label: 'Email' },
];

export interface Interaction {
  id: number;
  contactId: number;
  sellerId: number;
  type: InteractionType;
  date: string;
  time: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInteractionData {
  contactId: number;
  type: InteractionType;
  date: string;
  time?: string | null;
  notes?: string | null;
}

export interface UpdateInteractionData {
  type?: InteractionType;
  date?: string;
  time?: string | null;
  notes?: string | null;
}

// Seller types (for admin)
export interface Seller {
  id: number;
  email: string;
  name: string;
  role: 'seller';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSellerData {
  email: string;
  password: string;
  name: string;
}

export interface UpdateSellerData {
  email?: string | null;
  password?: string | null;
  name?: string | null;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

