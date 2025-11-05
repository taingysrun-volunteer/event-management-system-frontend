import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'admin/events',
    loadComponent: () => import('./features/admin/events/event-list.component').then(m => m.EventListComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/user/user-dashboard.component').then(m => m.UserDashboardComponent)
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];
