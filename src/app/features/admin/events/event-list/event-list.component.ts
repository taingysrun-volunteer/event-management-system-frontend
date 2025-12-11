import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../../core/services/event.service';
import { Event } from '../../../../core/models/event.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToolbarComponent } from '../../../../shared/components/toolbar/toolbar.component';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ToolbarComponent],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss']
})
export class EventListComponent implements OnInit {
  events = signal<Event[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentPage = signal(0);
  totalPages = signal(0);
  pageSize = 10;
  showDeleteModal = signal(false);
  eventToDelete = signal<{ id: string; title: string } | null>(null);

  // Search and filter
  searchTerm = signal('');
  selectedStatus = signal('ALL');
  statusOptions = ['ALL', 'ACTIVE', 'DRAFT', 'CANCELLED', 'COMPLETED'];

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const searchTerm = this.searchTerm() || undefined;
    const status = this.selectedStatus() !== 'ALL' ? this.selectedStatus() : undefined;

    this.eventService.searchAllEvents(searchTerm, status, this.currentPage(), this.pageSize).subscribe({
      next: (response: any) => {

        // Handle paginated response
        if (response.events && Array.isArray(response.events)) {
          this.events.set(response.events);
          this.totalPages.set(response.totalPages || 1);
        }
        // Handle direct array response
        else if (Array.isArray(response)) {
          this.events.set(response);
          this.totalPages.set(1);
        }
        // Handle empty or unknown response
        else {
          this.events.set([]);
          this.totalPages.set(0);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load events');
        this.isLoading.set(false);
        console.error('Error loading events:', error);
      }
    });
  }

  openDeleteModal(id: string, title: string): void {
    this.eventToDelete.set({ id, title });
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.eventToDelete.set(null);
  }

  confirmDelete(): void {
    const event = this.eventToDelete();
    if (!event) return;

    this.eventService.deleteEvent(event.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadEvents();
      },
      error: (error) => {
        this.errorMessage.set('Failed to delete event');
        console.error('Error deleting event:', error);
        this.closeDeleteModal();
      }
    });
  }

  cloneEvent(event: Event): void {
    // Navigate to create form with clone parameter
    this.router.navigate(['/admin/events/create'], {
      queryParams: { clone: event.id }
    });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadEvents();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadEvents();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadEvents();
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
      case 'published':
        return 'status-published';
      case 'draft':
        return 'status-draft';
      case 'cancelled':
        return 'status-cancelled';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-default';
    }
  }

  logout(): void {
    this.authService.logout();
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }

  onSearch(): void {
    this.currentPage.set(0); // Reset to first page
    this.loadEvents();
  }

  onStatusChange(): void {
    this.currentPage.set(0); // Reset to first page
    this.loadEvents();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus.set('ALL');
    this.currentPage.set(0);
    this.loadEvents();
  }
}
