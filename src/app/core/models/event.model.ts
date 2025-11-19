import { Category } from './category.model';

export interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: Date | string;
  startTime: Date | string;
  endTime: Date | string;
  location: string;
  capacity?: number;
  availableSeats?: number;
  category?: Category;
  categoryId?: number;
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
  organizerId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface EventListResponse {
  events: Event[];
  totalItems: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  eventDate: Date | string;
  startTime: Date | string;
  endTime: Date | string;
  location: string;
  capacity?: number;
  categoryId?: number;
  status?: string;
}

export interface UpdateEventRequest extends CreateEventRequest {
  id: string;
}
