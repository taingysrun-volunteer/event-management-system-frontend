import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify-otp',
    loadComponent: () => import('./features/auth/verify-otp/verify-otp.component').then(m => m.VerifyOtpComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'admin/events/create',
    loadComponent: () => import('./features/admin/events/event-create/event-create.component').then(m => m.EventCreateComponent),
    canActivate: [roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'admin/events/edit/:id',
    loadComponent: () => import('./features/admin/events/event-edit/event-edit.component').then(m => m.EventEditComponent),
    canActivate: [roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'admin/events/:id',
    loadComponent: () => import('./features/admin/events/event-detail/event-detail.component').then(m => m.EventDetailComponent),
    canActivate: [roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'admin/events',
    loadComponent: () => import('./features/admin/events/event-list/event-list.component').then(m => m.EventListComponent),
    canActivate: [roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'admin/categories',
    loadComponent: () => import('./features/admin/categories/category-list.component').then(m => m.CategoryListComponent),
    canActivate: [roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./features/admin/users/user-list.component').then(m => m.UserListComponent),
    canActivate: [roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'my-registrations',
    loadComponent: () => import('./features/user/registrations/my-registrations.component').then(m => m.MyRegistrationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'events/:id',
    loadComponent: () => import('./features/user/events/event-detail/event-detail.component').then(m => m.EventDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'events',
    loadComponent: () => import('./features/user/events/event-browse/event-browse.component').then(m => m.EventBrowseComponent),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    redirectTo: '/events',
    pathMatch: 'full'
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];
