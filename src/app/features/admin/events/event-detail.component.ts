import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { AuthService } from '../../../core/services/auth.service';
import { Event } from '../../../core/models/event.model';
import { Registration, UpdateRegistrationRequest, RegistrationStatus } from '../../../core/models/registration.model';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';
import { SuccessDialogComponent } from '../../../shared/components/success-dialog/success-dialog.component';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ToolbarComponent, SuccessDialogComponent],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss']
})
export class EventDetailComponent implements OnInit {
  event = signal<Event | null>(null);
  registrations = signal<Registration[]>([]);
  isLoading = signal(true);
  isLoadingRegistrations = signal(false);
  errorMessage = signal<string | null>(null);
  eventId: string = '';
  showRegistrations = signal(false);

  // Pagination for registrations
  currentPage = signal(0);
  totalPages = signal(0);
  totalRegistrations = signal(0);
  pageSize = 10;

  // Update registration dialog
  showUpdateDialog = signal(false);
  isUpdating = signal(false);
  selectedRegistration = signal<Registration | null>(null);
  updateData: UpdateRegistrationRequest = {
    status: undefined,
    notes: undefined
  };

  // Success/Error dialogs
  showSuccessDialog = signal(false);
  showErrorDialog = signal(false);
  dialogTitle = '';
  dialogMessage = '';

  // Expose enum to template
  RegistrationStatus = RegistrationStatus;

  constructor(
    private eventService: EventService,
    private registrationService: RegistrationService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    this.loadEvent();
  }

  loadEvent(): void {
    if (!this.eventId) {
      this.errorMessage.set('Invalid event ID');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.eventService.getEventById(this.eventId).subscribe({
      next: (event: Event) => {
        this.event.set(event);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.errorMessage.set('Failed to load event details');
        this.isLoading.set(false);
      }
    });
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  }

  formatTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles'
    });
  }

  getStatusClass(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'postponed':
        return 'status-postponed';
      default:
        return 'status-default';
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/events']);
  }

  goToEdit(): void {
    this.router.navigate(['/admin/events/edit', this.eventId]);
  }

  logout(): void {
    this.authService.logout();
  }

  toggleRegistrations(): void {
    this.showRegistrations.set(!this.showRegistrations());
    if (this.showRegistrations() && this.registrations().length === 0) {
      this.loadRegistrations();
    }
  }

  loadRegistrations(): void {
    if (!this.eventId) return;

    this.isLoadingRegistrations.set(true);
    this.registrationService.getEventRegistrations(this.eventId, this.currentPage(), this.pageSize).subscribe({
      next: (response) => {
        this.registrations.set(response.registrations);
        this.totalPages.set(response.totalPages);
        this.totalRegistrations.set(response.totalElements);
        this.isLoadingRegistrations.set(false);
      },
      error: (error) => {
        console.error('Error loading registrations:', error);
        this.isLoadingRegistrations.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadRegistrations();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  exportRegistrations(): void {
    if (!this.eventId) return;

    this.registrationService.exportEventRegistrations(this.eventId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `event-${this.eventId}-registrations.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting registrations:', error);
        alert('Failed to export registrations. Please try again.');
      }
    });
  }

  formatRegistrationDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  getRegistrationStatusClass(status: string): string {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case RegistrationStatus.CONFIRMED:
        return 'status-confirmed';
      case RegistrationStatus.CANCELLED:
        return 'status-cancelled';
      case RegistrationStatus.PENDING:
        return 'status-pending';
      default:
        return '';
    }
  }

  openUpdateDialog(registration: Registration): void {
    this.selectedRegistration.set(registration);
    this.updateData = {
      status: registration.status as RegistrationStatus,
      notes: registration.notes || ''
    };
    this.showUpdateDialog.set(true);
  }

  closeUpdateDialog(): void {
    if (!this.isUpdating()) {
      this.showUpdateDialog.set(false);
      this.selectedRegistration.set(null);
      this.updateData = {
        status: undefined,
        notes: undefined
      };
    }
  }

  confirmUpdate(): void {
    const registration = this.selectedRegistration();
    if (!registration) return;

    this.isUpdating.set(true);
    this.registrationService.updateRegistration(registration.id, this.updateData).subscribe({
      next: (updatedRegistration) => {
        this.isUpdating.set(false);
        this.showUpdateDialog.set(false);

        // Update the registration in the list
        const registrationsList = this.registrations();
        const index = registrationsList.findIndex(r => r.id === registration.id);
        if (index !== -1) {
          registrationsList[index] = updatedRegistration;
          this.registrations.set([...registrationsList]);
        }

        this.selectedRegistration.set(null);
        this.updateData = {
          status: undefined,
          notes: undefined
        };

        // Show success dialog
        this.dialogTitle = 'Registration Updated!';
        this.dialogMessage = `The registration status has been successfully updated to ${updatedRegistration.status}.`;
        this.showSuccessDialog.set(true);
      },
      error: (error) => {
        this.isUpdating.set(false);
        console.error('Error updating registration:', error);

        // Show error dialog
        this.dialogTitle = 'Update Failed';
        this.dialogMessage = error.error?.message || 'Failed to update registration. Please try again.';
        this.showErrorDialog.set(true);
      }
    });
  }

  closeSuccessDialog(): void {
    this.showSuccessDialog.set(false);
  }

  closeErrorDialog(): void {
    this.showErrorDialog.set(false);
  }
}
