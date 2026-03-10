import type { ROLES } from '../constants';

// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: typeof ROLES.ADMIN | typeof ROLES.SELLER;
  createdAt?: string;
  updatedAt?: string;
}

// Contact types
export type NextContactChannel = 'call' | 'email' | 'linkedin' | 'slack' | 'sms';

export interface Contact {
  id: number;
  sellerId: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  linkedin: string | null;
  followUpDate: string | null;
  nextContactChannel: NextContactChannel | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactData {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  linkedin?: string | null;
  followUpDate?: string | null;
  nextContactChannel?: NextContactChannel | null;
}

export interface UpdateContactData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  linkedin?: string | null;
  followUpDate?: string | null;
  nextContactChannel?: NextContactChannel | null;
}

/** Build full LinkedIn URL from username (stored as username only) */
export function linkedinUrl(username: string | null | undefined): string | null {
  if (!username || !username.trim()) return null;
  return `https://linkedin.com/in/${username.trim()}`;
}

// Interaction types
export type InteractionType =
  | 'call'
  | 'meeting'
  | 'email'
  | 'video_call'
  | 'note'
  | 'linkedin'
  | 'sms';

export interface InteractionTypeOption {
  value: InteractionType;
  label: string;
}

export const INTERACTION_TYPE_OPTIONS: InteractionTypeOption[] = [
  { value: 'call', label: 'Phone Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'email', label: 'Email' },
  { value: 'video_call', label: 'Video Call' },
  { value: 'note', label: 'Note' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'sms', label: 'SMS' },
];

export interface NextContactChannelOption {
  value: '' | NextContactChannel;
  label: string;
}

export const NEXT_CONTACT_CHANNEL_OPTIONS: NextContactChannelOption[] = [
  { value: '', label: 'Choose channel' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'slack', label: 'Slack' },
  { value: 'sms', label: 'SMS' },
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
  role: typeof ROLES.SELLER;
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
