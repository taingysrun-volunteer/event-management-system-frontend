import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RegistrationService } from '../../core/services/registration.service';
import { ToolbarComponent } from '../../shared/components/toolbar/toolbar.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, ToolbarComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit {
  currentUser: any;
  totalRegistrations = signal<number>(0);
  upcomingEvents = signal<number>(0);
  pastEvents = signal<number>(0);
  loadingStats = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    private registrationService: RegistrationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser();
    this.loadRegistrationStats();
  }

  loadRegistrationStats(): void {
    this.loadingStats.set(true);
    this.registrationService.getRegistrationStats().subscribe({
      next: (stats) => {
        this.totalRegistrations.set(stats.totalRegistrations);
        this.upcomingEvents.set(stats.upcomingEvents);
        this.pastEvents.set(stats.pastEvents);
        this.loadingStats.set(false);
      },
      error: (error) => {
        console.error('Error loading registration stats:', error);
        this.loadingStats.set(false);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  browseEvents(): void {
    this.router.navigate(['/events']);
  }

  viewMyRegistrations(): void {
    this.router.navigate(['/my-registrations']);
  }
}
