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


  getPublishedEvents(page: number = 0, size: number = 10): Observable<EventListResponse> {
    return this.apiService.get<EventListResponse>(`/events?status=ACTIVE&page=${page}&size=${size}`);
  }

  searchEvents(searchTerm: string, categoryId?: string, page: number = 0, size: number = 10): Observable<EventListResponse> {
    let params = `status=ACTIVE&page=${page}&size=${size}`;
    if (searchTerm) {
      params += `&search=${encodeURIComponent(searchTerm)}`;
    }
    if (categoryId) {
      params += `&categoryId=${categoryId}`;
    }
    return this.apiService.get<EventListResponse>(`/events?${params}`);
  }

  searchAllEvents(searchTerm?: string, status?: string, page: number = 0, size: number = 10): Observable<EventListResponse> {
    let params = `page=${page}&size=${size}`;
    if (searchTerm && searchTerm.trim()) {
      params += `&search=${encodeURIComponent(searchTerm.trim())}`;
    }
    if (status && status !== 'ALL') {
      params += `&status=${status}`;
    }
    return this.apiService.get<EventListResponse>(`/events?${params}`);
  }
}
