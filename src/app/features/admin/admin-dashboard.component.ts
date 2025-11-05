import {Component, Inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {User} from '../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {
  currentUser: any;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}


  ngOnInit(): void {
    this.currentUser = this.authService.currentUser();
  }

  logout(): void {
    this.authService.logout();
  }
}
