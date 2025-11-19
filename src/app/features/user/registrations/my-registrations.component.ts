import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegistrationService } from '../../../core/services/registration.service';
import { Registration, RegistrationStatus } from '../../../core/models/registration.model';
import {AuthService} from '../../../core/services/auth.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SuccessDialogComponent } from '../../../shared/components/success-dialog/success-dialog.component';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-my-registrations',
  standalone: true,
  imports: [CommonModule, ConfirmationDialogComponent, SuccessDialogComponent, ToolbarComponent, QRCodeComponent],
  templateUrl: './my-registrations.component.html',
  styleUrls: ['./my-registrations.component.scss']
})
export class MyRegistrationsComponent implements OnInit {
  currentUser: any;
  registrations = signal<Registration[]>([]);
  loading = signal<boolean>(false);

  // Pagination
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  pageSize = 10;

  // Cancel dialog
  showCancelDialog = signal<boolean>(false);
  cancelling = signal<boolean>(false);
  selectedRegistration: Registration | null = null;
  showCancelSuccessDialog = signal<boolean>(false);

  // QR Code modal
  showQRCodeModal = signal<boolean>(false);
  qrCodeData = signal<string>('');

  constructor(
    private registrationService: RegistrationService,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser();
    this.loadRegistrations();
  }

  loadRegistrations(): void {
    this.loading.set(true);
    this.registrationService.getMyRegistrations(this.currentUser.id, this.currentPage(), this.pageSize).subscribe({
      next: (response) => {
        this.registrations.set(response.registrations);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading registrations:', error);
        this.loading.set(false);
      }
    });
  }

  viewEvent(eventId: string): void {
    this.router.navigate(['/events', eventId]);
  }

  openCancelDialog(registration: Registration): void {
    this.selectedRegistration = registration;
    this.showCancelDialog.set(true);
  }

  closeCancelDialog(): void {
    if (!this.cancelling()) {
      this.showCancelDialog.set(false);
      this.selectedRegistration = null;
    }
  }

  confirmCancelRegistration(): void {
    if (!this.selectedRegistration) return;

    this.cancelling.set(true);
    this.registrationService.cancelRegistration(this.selectedRegistration.id).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.showCancelDialog.set(false);
        this.selectedRegistration = null;

        // Show success dialog
        this.showCancelSuccessDialog.set(true);

        // Reload registrations
        this.loadRegistrations();
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

  getEventDate(registration: Registration): string {
    if (!registration.event?.eventDate) {
      return 'N/A';
    }
    try {
      const date = new Date(registration.event.eventDate);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error parsing event date:', error);
      return 'Invalid Date';
    }
  }

  getEventTime(registration: Registration): string {
    if (!registration.event?.startTime || !registration.event?.endTime) {
      return 'N/A';
    }
    try {
      const startDate = new Date(registration.event.startTime);
      const endDate = new Date(registration.event.endTime);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'Invalid Time';
      }

      const startTime = startDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const endTime = endDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${startTime} - ${endTime}`;
    } catch (error) {
      console.error('Error parsing event time:', error);
      return 'Invalid Time';
    }
  }

  getRegistrationDate(registration: Registration): string {
    if (!registration.createdAt) {
      return 'N/A';
    }
    try {
      const date = new Date(registration.createdAt);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error parsing registration date:', error);
      return 'Invalid Date';
    }
  }

  isEventUpcoming(registration: Registration): boolean {
    return new Date(registration.event.eventDate) > new Date();
  }

  isEventToday(registration: Registration): boolean {
    const today = new Date();
    const eventDate = new Date(registration.event.eventDate);
    return today.toDateString() === eventDate.toDateString();
  }

  getStatusClass(status: string): string {
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

  goToHome(): void {
    this.router.navigate(['/events']);
  }

  browseEvents(): void {
    this.router.navigate(['/events']);
  }

  logout(): void {
    this.authService.logout();
  }

  openQRCodeModal(registration: Registration): void {
    this.selectedRegistration = registration;

    // Check if registration has a ticketId
    if (registration.ticketId) {
      // Get existing ticket
      this.registrationService.getTicket(registration.ticketId).subscribe({
        next: (response) => {
          this.qrCodeData.set(response.qrCode);
          this.showQRCodeModal.set(true);
        },
        error: (error) => {
          console.error('Error fetching ticket:', error);
          alert('Failed to load ticket. Please try again.');
        }
      });
    } else {
      // Generate new ticket
      this.registrationService.generateTicket(registration.id).subscribe({
        next: (response) => {
          this.qrCodeData.set(response.qrCode);
          this.showQRCodeModal.set(true);
          // Update registration with ticketId
          registration.ticketId = response.id;
        },
        error: (genError) => {
          console.error('Error generating ticket:', genError);
          alert('Failed to generate ticket. Please try again.');
        }
      });
    }
  }

  closeQRCodeModal(): void {
    this.showQRCodeModal.set(false);
    this.qrCodeData.set('');
    this.selectedRegistration = null;
  }

  downloadQRCode(): void {
    if (!this.selectedRegistration) return;

    const canvas = document.querySelector('.qr-code-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-${this.selectedRegistration.event.title}-${this.selectedRegistration.id}.png`;
      link.click();
    }
  }
}
