// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'seller';
  createdAt?: string;
  updatedAt?: string;
}

// Customer types
export interface Customer {
  id: number;
  sellerId: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
}

// Interaction types
export type InteractionType = 'call' | 'meeting' | 'email';

export interface Interaction {
  id: number;
  customerId: number;
  sellerId: number;
  type: InteractionType;
  date: string;
  time: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInteractionData {
  customerId: number;
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
  email?: string;
  password?: string;
  name?: string;
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

