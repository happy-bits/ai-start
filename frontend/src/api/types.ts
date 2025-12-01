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
  company: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactData {
  name: string;
  email?: string | null;
  company?: string | null;
}

export interface UpdateContactData {
  name?: string;
  email?: string | null;
  company?: string | null;
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

