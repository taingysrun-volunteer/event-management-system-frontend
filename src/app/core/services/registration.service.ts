import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Registration,
  RegistrationListResponse,
  CreateRegistrationRequest,
  RegistrationResponse,
  UpdateRegistrationRequest
} from '../models/registration.model';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all registrations for the current user
   */
  getMyRegistrations(userId: string, page: number = 0, size: number = 10): Observable<RegistrationListResponse> {
    return this.apiService.get<RegistrationListResponse>(`/registrations/user/${userId}?page=${page}&size=${size}`);
  }

  /**
   * Get a specific registration by ID
   */
  getRegistrationById(id: string): Observable<Registration> {
    return this.apiService.get<Registration>(`/registrations/${id}`);
  }

  /**
   * Register for an event
   */
  registerForEvent(request: CreateRegistrationRequest): Observable<RegistrationResponse> {
    return this.apiService.post<RegistrationResponse>('/registrations', request);
  }

  /**
   * Cancel a registration
   */
  cancelRegistration(id: string): Observable<RegistrationResponse> {
    return this.apiService.put<RegistrationResponse>(`/registrations/${id}/cancel`, null);
  }

  /**
   * Check if user is registered for an event
   */
  isRegisteredForEvent(eventId: string): Observable<{ registered: boolean; registrationId?: string }> {
    return this.apiService.get<{ registered: boolean; registrationId?: string }>(
      `/registrations/check/${eventId}`
    );
  }

  /**
   * Get registration statistics for the current user
   */
  getRegistrationStats(): Observable<{
    totalRegistrations: number;
    upcomingEvents: number;
    pastEvents: number;
  }> {
    return this.apiService.get<{
      totalRegistrations: number;
      upcomingEvents: number;
      pastEvents: number;
    }>('/registrations/stats');
  }

  /**
   * Get all registrations for a specific event (Admin only)
   */
  getEventRegistrations(eventId: string, page: number = 0, size: number = 10): Observable<RegistrationListResponse> {
    return this.apiService.get<RegistrationListResponse>(`/events/${eventId}/registrations?page=${page}&size=${size}`);
  }

  /**
   * Export event registrations to CSV (Admin only)
   */
  exportEventRegistrations(eventId: string): Observable<Blob> {
    // Note: This uses HttpClient directly for blob response type
    // The apiService.get() doesn't support responseType option
    const apiUrl = 'http://localhost:8080/api';
    return this.apiService['http'].get(`${apiUrl}/events/${eventId}/registrations/export`, {
      responseType: 'blob' as 'json'
    }) as Observable<Blob>;
  }

  /**
   * Generate ticket for a registration
   */
  generateTicket(registrationId: string): Observable<{ id: string; code: string; qrCode: string; registrationId: string }> {
    return this.apiService.post<{ id: string; code: string; qrCode: string; registrationId: string }>(`/tickets/generate/${registrationId}`, null);
  }

  /**
   * Get ticket by ID
   */
  getTicket(ticketId: string): Observable<{ id: string; code: string; qrCode: string; registrationId: string }> {
    return this.apiService.get<{ id: string; code: string; qrCode: string; registrationId: string }>(`/tickets/${ticketId}`);
  }

  /**
   * Update registration (Admin only)
   */
  updateRegistration(id: string, request: UpdateRegistrationRequest): Observable<Registration> {
    return this.apiService.put<Registration>(`/registrations/${id}`, request);
  }
}
