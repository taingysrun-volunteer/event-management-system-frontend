import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { Event } from '../../../core/models/event.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

    this.eventService.getAllEvents(this.currentPage(), this.pageSize).subscribe({
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

  deleteEvent(id: string, title: string): void {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      this.eventService.deleteEvent(id).subscribe({
        next: () => {
          this.loadEvents();
        },
        error: (error) => {
          this.errorMessage.set('Failed to delete event');
          console.error('Error deleting event:', error);
        }
      });
    }
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
      day: 'numeric'
    });
  }

  formatTime(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      hour: 'numeric',
      minute: 'numeric'
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
}
