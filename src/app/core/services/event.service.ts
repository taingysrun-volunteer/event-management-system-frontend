import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Event, EventListResponse, CreateEventRequest, UpdateEventRequest } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  constructor(private apiService: ApiService) {}

  getAllEvents(page: number = 0, size: number = 10): Observable<EventListResponse> {
    return this.apiService.get<EventListResponse>(`/events?page=${page}&size=${size}`);
  }

  getEventById(id: string): Observable<Event> {
    return this.apiService.get<Event>(`/events/${id}`);
  }

  createEvent(event: CreateEventRequest): Observable<Event> {
    return this.apiService.post<Event>('/events', event);
  }

  updateEvent(event: UpdateEventRequest): Observable<Event> {
    return this.apiService.put<Event>(`/events/${event.id}`, event);
  }

  deleteEvent(id: string): Observable<void> {
    return this.apiService.delete<void>(`/events/${id}`);
  }

  publishEvent(id: string): Observable<Event> {
    return this.apiService.post<Event>(`/events/${id}/publish`, {});
  }

  cancelEvent(id: string): Observable<Event> {
    return this.apiService.post<Event>(`/events/${id}/cancel`, {});
  }
}
