import { Event } from './event.model';
import { User } from './user.model';

export enum RegistrationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

export interface Registration {
  id: string;
  event: Event;
  eventId: string;
  user: User;
  userId: string;
  registrationDate: Date | string;
  status: RegistrationStatus | string;
  notes?: string;
  ticketId?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface RegistrationListResponse {
  registrations: Registration[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CreateRegistrationRequest {
  eventId: string;
  userId?: string;
}

export interface RegistrationResponse {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  registrationDate: Date | string;
  message?: string;
}

export interface UpdateRegistrationRequest {
  status?: RegistrationStatus;
  notes?: string;
}
