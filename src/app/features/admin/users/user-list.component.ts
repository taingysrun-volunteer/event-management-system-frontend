import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users = signal<User[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Pagination and filtering
  currentPage = signal(0);
  totalPages = signal(0);
  totalItems = signal(0);
  pageSize = signal(10);
  hasNext = signal(false);
  hasPrevious = signal(false);

  // Search and filters
  searchQuery = signal('');
  roleFilter = signal('');
  sortBy = signal('createdAt');
  sortDir = signal<'asc' | 'desc'>('desc');

  // Add/Edit User Modal
  showUserModal = signal(false);
  isEditMode = signal(false);
  userToEdit = signal<User | null>(null);
  formData = signal({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'USER'
  });
  roleOptions = ['USER', 'ADMIN'];

  // Delete User Modal
  showDeleteModal = signal(false);
  userToDelete = signal<User | null>(null);

  // Reset Password Modal
  showResetPasswordModal = signal(false);
  userToReset = signal<User | null>(null);
  newPassword = signal('');
  showResetPassword = signal(false);

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const params = {
      search: this.searchQuery() || undefined,
      role: this.roleFilter() || undefined,
      page: this.currentPage(),
      size: this.pageSize(),
      sortBy: this.sortBy(),
      sortDir: this.sortDir()
    };

    this.userService.getAllUsers(params).subscribe({
      next: (response) => {
        this.users.set(response.users);
        this.currentPage.set(response.currentPage);
        this.totalPages.set(response.totalPages);
        this.totalItems.set(response.totalItems);
        this.hasNext.set(response.hasNext);
        this.hasPrevious.set(response.hasPrevious);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage.set('Failed to load users');
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(0);
    this.loadUsers();
  }

  onRoleFilterChange(role: string): void {
    this.roleFilter.set(role);
    this.currentPage.set(0);
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('');
    this.currentPage.set(0);
    this.loadUsers();
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.userToEdit.set(null);
    this.formData.set({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'USER'
    });
    this.showUserModal.set(true);
  }

  openEditModal(user: User): void {
    this.isEditMode.set(true);
    this.userToEdit.set(user);
    this.formData.set({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      role: user.role || 'USER'
    });
    this.showUserModal.set(true);
  }

  closeUserModal(): void {
    this.showUserModal.set(false);
    this.userToEdit.set(null);
    this.formData.set({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'USER'
    });
  }

  saveUser(): void {
    const data = this.formData();

    // Validation
    if (!data.username || !data.email || !data.firstName || !data.lastName) {
      this.errorMessage.set('Please fill in all required fields');
      setTimeout(() => this.errorMessage.set(null), 3000);
      return;
    }

    if (!this.isEditMode() && !data.password) {
      this.errorMessage.set('Password is required for new users');
      setTimeout(() => this.errorMessage.set(null), 3000);
      return;
    }

    if (this.isEditMode()) {
      // Update existing user
      const userId = this.userToEdit()?.id;
      if (!userId) return;

      const updateData = {
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role
      };

      this.userService.updateUser(userId, updateData).subscribe({
        next: () => {
          this.successMessage.set('User updated successfully');
          this.closeUserModal();
          this.loadUsers();
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.errorMessage.set(error.error?.message || 'Failed to update user');
          setTimeout(() => this.errorMessage.set(null), 3000);
        }
      });
    } else {
      // Create new user
      const createData = {
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        role: data.role
      };

      this.userService.createUser(createData).subscribe({
        next: () => {
          this.successMessage.set('User created successfully');
          this.closeUserModal();
          this.loadUsers();
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.errorMessage.set(error.error?.message || 'Failed to create user');
          setTimeout(() => this.errorMessage.set(null), 3000);
        }
      });
    }
  }

  openDeleteModal(user: User): void {
    this.userToDelete.set(user);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.userToDelete.set(null);
  }

  confirmDelete(): void {
    const user = this.userToDelete();
    if (!user) return;

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.successMessage.set('User deleted successfully');
        this.closeDeleteModal();
        this.loadUsers();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.errorMessage.set('Failed to delete user');
        this.closeDeleteModal();
        setTimeout(() => this.errorMessage.set(null), 3000);
      }
    });
  }

  getRoleBadgeClass(role?: string): string {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'role-admin';
      case 'USER':
        return 'role-user';
      default:
        return 'role-default';
    }
  }

  formatDate(date?: Date | string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.currentPage.update(p => p + 1);
      this.loadUsers();
    }
  }

  previousPage(): void {
    if (this.hasPrevious()) {
      this.currentPage.update(p => p - 1);
      this.loadUsers();
    }
  }

  goToFirstPage(): void {
    this.currentPage.set(0);
    this.loadUsers();
  }

  goToLastPage(): void {
    this.currentPage.set(this.totalPages() - 1);
    this.loadUsers();
  }

  logout(): void {
    this.authService.logout();
  }

  openResetPasswordModal(user: User): void {
    this.userToReset.set(user);
    this.newPassword.set('');
    this.showResetPassword.set(false);
    this.showResetPasswordModal.set(true);
  }

  closeResetPasswordModal(): void {
    this.showResetPasswordModal.set(false);
    this.userToReset.set(null);
    this.newPassword.set('');
    this.showResetPassword.set(false);
  }

  toggleResetPasswordVisibility(): void {
    this.showResetPassword.update(show => !show);
  }

  confirmResetPassword(): void {
    const user = this.userToReset();
    const password = this.newPassword();

    if (!user || !password) {
      this.errorMessage.set('Please enter a new password');
      setTimeout(() => this.errorMessage.set(null), 3000);
      return;
    }

    if (password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters');
      setTimeout(() => this.errorMessage.set(null), 3000);
      return;
    }

    this.userService.resetPassword(user.id, password).subscribe({
      next: () => {
        this.successMessage.set('Password reset successfully');
        this.closeResetPasswordModal();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Error resetting password:', error);
        this.errorMessage.set('Failed to reset password');
        this.closeResetPasswordModal();
        setTimeout(() => this.errorMessage.set(null), 3000);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}
