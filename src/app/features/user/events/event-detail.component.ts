import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { Event } from '../../../core/models/event.model';
import {AuthService} from '../../../core/services/auth.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SuccessDialogComponent } from '../../../shared/components/success-dialog/success-dialog.component';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, ConfirmationDialogComponent, SuccessDialogComponent, ToolbarComponent],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss']
})
export class EventDetailComponent implements OnInit {
  currentUser: any;
  event = signal<Event | null>(null);
  loading = signal<boolean>(true);
  showRegisterModal = signal<boolean>(false);
  registering = signal<boolean>(false);
  registrationSuccess = signal<boolean>(false);
  registrationError = signal<string | null>(null);
  isAlreadyRegistered = signal<boolean>(false);
  existingRegistrationId = signal<string | null>(null);
  showCancelDialog = signal<boolean>(false);
  cancelling = signal<boolean>(false);
  showCancelSuccessDialog = signal<boolean>(false);

  constructor(
    private eventService: EventService,
    private registrationService: RegistrationService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser();
    // Reset registration status
    this.isAlreadyRegistered.set(false);
    this.existingRegistrationId.set(null);

    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.loadEvent(eventId);
    }
  }

  loadEvent(id: string): void {
    this.loading.set(true);
    // Check registration status first
    this.checkRegistrationStatus(id);

    this.eventService.getEventById(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.loading.set(false);
        this.router.navigate(['/events']);
      }
    });
  }

  checkRegistrationStatus(eventId: string): void {
    this.registrationService.isRegisteredForEvent(eventId).subscribe({
      next: (response) => {
        this.isAlreadyRegistered.set(response.registered);
        if (response.registrationId) {
          this.existingRegistrationId.set(response.registrationId);
        }
      },
      error: (error) => {
        console.error('Error checking registration status:', error);
      }
    });
  }

  getEventDate(event: Event): string {
    return new Date(event.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getEventTime(event: Event): string {
    const startTime = new Date(event.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTime = new Date(event.endTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${startTime} - ${endTime}`;
  }

  isEventFull(event: Event): boolean {
    return event.availableSeats !== undefined && event.availableSeats <= 0;
  }

  isEventUpcoming(event: Event): boolean {
    return new Date(event.eventDate) > new Date();
  }

  canRegister(event: Event): boolean {
    return this.isEventUpcoming(event) &&
           !this.isEventFull(event) &&
           event.status === 'published' &&
           !this.isAlreadyRegistered();
  }

  openRegisterModal(): void {
    this.registrationError.set(null);
    this.showRegisterModal.set(true);
  }

  closeRegisterModal(): void {
    this.showRegisterModal.set(false);
    this.registrationSuccess.set(false);
    this.registrationError.set(null);
  }

  confirmRegistration(): void {
    const event = this.event();
    if (!event) return;

    this.registering.set(true);
    this.registrationError.set(null);

    this.registrationService.registerForEvent({ eventId: event.id, userId: this.currentUser.id }).subscribe({
      next: (response) => {
        this.registering.set(false);
        this.registrationSuccess.set(true);
        this.isAlreadyRegistered.set(true);
        this.existingRegistrationId.set(response.id);

        // Reload event to get updated seat count
        this.loadEvent(event.id);

        // Auto-close modal after 2 seconds
        setTimeout(() => {
          this.closeRegisterModal();
        }, 2000);
      },
      error: (error) => {
        this.registering.set(false);
        const errorMessage = error.error?.message || 'Failed to register for event. Please try again.';
        this.registrationError.set(errorMessage);
        console.error('Error registering for event:', error);
      }
    });
  }

  openCancelDialog(): void {
    this.showCancelDialog.set(true);
  }

  closeCancelDialog(): void {
    if (!this.cancelling()) {
      this.showCancelDialog.set(false);
    }
  }

  confirmCancelRegistration(): void {
    const registrationId = this.existingRegistrationId();
    if (!registrationId) return;

    this.cancelling.set(true);
    this.registrationService.cancelRegistration(registrationId).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.isAlreadyRegistered.set(false);
        this.existingRegistrationId.set(null);
        this.showCancelDialog.set(false);

        // Show success dialog
        this.showCancelSuccessDialog.set(true);

        // Reload event to get updated seat count
        const event = this.event();
        if (event) {
          this.loadEvent(event.id);
        }
      },
      error: (error) => {
        this.cancelling.set(false);
        console.error('Error cancelling registration:', error);
        alert('Failed to cancel registration. Please try again.');
      }
    });
  }

  closeCancelSuccessDialog(): void {
    this.showCancelSuccessDialog.set(false);
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }

  logout(): void {
    this.authService.logout();
  }

  getStatusClass(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'published':
        return 'status-published';
      case 'cancelled':
        return 'status-cancelled';
      case 'completed':
        return 'status-completed';
      case 'draft':
        return 'status-draft';
      default:
        return '';
    }
  }
}
