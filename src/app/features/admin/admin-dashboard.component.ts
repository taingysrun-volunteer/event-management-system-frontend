import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SummaryService } from '../../core/services/summary.service';
import { ToolbarComponent } from '../../shared/components/toolbar/toolbar.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ToolbarComponent],
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
    private summaryService: SummaryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    this.summaryService.getDashboardSummary().subscribe({
      next: (summary) => {
        this.eventsCount.set(summary.totalEvents);
        this.usersCount.set(summary.totalUsers);
        this.categoriesCount.set(summary.totalCategories);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard summary:', error);
        this.isLoading.set(false);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
