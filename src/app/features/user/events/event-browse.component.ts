import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { Event } from '../../../core/models/event.model';
import { Category } from '../../../core/models/category.model';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';

@Component({
  selector: 'app-event-browse',
  standalone: true,
  imports: [CommonModule, FormsModule, ToolbarComponent],
  templateUrl: './event-browse.component.html',
  styleUrls: ['./event-browse.component.scss']
})
export class EventBrowseComponent implements OnInit {
  currentUser: any;
  events = signal<Event[]>([]);
  categories = signal<Category[]>([]);
  loading = signal<boolean>(false);

  // Pagination
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  pageSize = 9; // 3x3 grid

  // Filters
  searchTerm = '';
  selectedCategoryId = '';

  constructor(
    private eventService: EventService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser();
    this.loadCategories();
    this.loadEvents();
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (response) => {
        this.categories.set(response.categories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadEvents(): void {
    this.loading.set(true);

    if (this.searchTerm || this.selectedCategoryId) {
      this.eventService.searchEvents(
        this.searchTerm,
        this.selectedCategoryId,
        this.currentPage(),
        this.pageSize
      ).subscribe({
        next: (response) => {
          this.events.set(response.events);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalItems);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading events:', error);
          this.loading.set(false);
        }
      });
    } else {
      this.eventService.getPublishedEvents(this.currentPage(), this.pageSize).subscribe({
        next: (response) => {
          this.events.set(response.events);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalItems);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading events:', error);
          this.loading.set(false);
        }
      });
    }
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.loadEvents();
  }

  onCategoryChange(): void {
    this.currentPage.set(0);
    this.loadEvents();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = '';
    this.currentPage.set(0);
    this.loadEvents();
  }

  viewEventDetail(eventId: string): void {
    this.router.navigate(['/events', eventId]);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadEvents();
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

  getEventDate(event: Event): string {
    return new Date(event.eventDate).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  goToMyRegistrations(): void {
    this.router.navigate(['/my-registrations']);
  }

  logout(): void {
    this.authService.logout();
  }
}
