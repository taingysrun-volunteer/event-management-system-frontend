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
  category?: string;
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
  organizerId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface EventListResponse {
  content: Event[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  startDate: Date | string;
  endDate: Date | string;
  location: string;
  capacity?: number;
  category?: string;
}

export interface UpdateEventRequest extends CreateEventRequest {
  id: string;
}
