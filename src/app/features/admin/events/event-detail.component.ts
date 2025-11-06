import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { Event } from '../../../core/models/event.model';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss']
})
export class EventDetailComponent implements OnInit {
  event = signal<Event | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  eventId: string = '';

  constructor(
    private eventService: EventService,
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
}
