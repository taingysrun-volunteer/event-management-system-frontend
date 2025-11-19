import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'admin/events/create',
    loadComponent: () => import('./features/admin/events/event-create.component').then(m => m.EventCreateComponent)
  },
  {
    path: 'admin/events/edit/:id',
    loadComponent: () => import('./features/admin/events/event-edit.component').then(m => m.EventEditComponent)
  },
  {
    path: 'admin/events/:id',
    loadComponent: () => import('./features/admin/events/event-detail.component').then(m => m.EventDetailComponent)
  },
  {
    path: 'admin/events',
    loadComponent: () => import('./features/admin/events/event-list.component').then(m => m.EventListComponent)
  },
  {
    path: 'admin/categories',
    loadComponent: () => import('./features/admin/categories/category-list.component').then(m => m.CategoryListComponent)
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./features/admin/users/user-list.component').then(m => m.UserListComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'my-registrations',
    loadComponent: () => import('./features/user/registrations/my-registrations.component').then(m => m.MyRegistrationsComponent)
  },
  {
    path: 'events/:id',
    loadComponent: () => import('./features/user/events/event-detail.component').then(m => m.EventDetailComponent)
  },
  {
    path: 'events',
    loadComponent: () => import('./features/user/events/event-browse.component').then(m => m.EventBrowseComponent)
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
