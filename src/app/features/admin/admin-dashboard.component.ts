import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EventService } from '../../core/services/event.service';
import { CategoryService } from '../../core/services/category.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  currentUser: any;
  eventsCount = signal<number>(0);
  usersCount = signal<number>(0);
  categoriesCount = signal<number>(0);
  isLoading = signal<boolean>(true);

  constructor(
    private authService: AuthService,
    private eventService: EventService,
    private categoryService: CategoryService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    forkJoin({
      events: this.eventService.getAllEvents(0, 1),
      categories: this.categoryService.getAllCategories(),
      users: this.userService.getAllUsers({ page: 0, size: 1 })
    }).subscribe({
      next: (results) => {
        // Handle events count
        if (results.events) {
          const eventsData = results.events as any;
          if (eventsData.totalElements !== undefined) {
            this.eventsCount.set(eventsData.totalElements);
          } else if (Array.isArray(eventsData)) {
            this.eventsCount.set(eventsData.length);
          } else if (eventsData.events && Array.isArray(eventsData.events)) {
            this.eventsCount.set(eventsData.totalElements || eventsData.events.length);
          }
        }

        // Handle categories count
        if (results.categories) {
          const categoriesData = results.categories as any;
          if (categoriesData.categories && Array.isArray(categoriesData.categories)) {
            this.categoriesCount.set(categoriesData.categories.length);
          } else if (Array.isArray(categoriesData)) {
            this.categoriesCount.set(categoriesData.length);
          }
        }

        // Handle users count
        if (results.users) {
          this.usersCount.set(results.users.totalItems);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading.set(false);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
