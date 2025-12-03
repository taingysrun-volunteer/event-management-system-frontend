import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UserListComponent } from './user-list.component';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockUsers: User[] = [
    {
      id: '1',
      username: 'john_doe',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER'
    },
    {
      id: '2',
      username: 'jane_admin',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'ADMIN'
    }
  ];

  const mockUsersResponse = {
    users: mockUsers,
    currentPage: 0,
    totalPages: 1,
    totalItems: 2,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  };

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'getAllUsers',
      'createUser',
      'updateUser',
      'deleteUser',
      'resetPassword'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize signals with default values', () => {
      expect(component.users()).toEqual([]);
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(component.successMessage()).toBeNull();
      expect(component.currentPage()).toBe(0);
      expect(component.totalPages()).toBe(0);
      expect(component.searchQuery()).toBe('');
      expect(component.roleFilter()).toBe('');
      expect(component.sortBy()).toBe('createdAt');
      expect(component.sortDir()).toBe('desc');
    });

    it('should load users on init', () => {
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));

      fixture.detectChanges();

      expect(userService.getAllUsers).toHaveBeenCalled();
      expect(component.users()).toEqual(mockUsers);
    });

    it('should have role options', () => {
      expect(component.roleOptions).toEqual(['USER', 'ADMIN']);
    });
  });

  describe('Load Users', () => {
    it('should load users successfully', () => {
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));

      component.loadUsers();

      expect(component.users()).toEqual(mockUsers);
      expect(component.currentPage()).toBe(0);
      expect(component.totalPages()).toBe(1);
      expect(component.totalItems()).toBe(2);
      expect(component.hasNext()).toBe(false);
      expect(component.hasPrevious()).toBe(false);
      expect(component.isLoading()).toBe(false);
    });

    it('should send correct parameters', () => {
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));

      component.loadUsers();

      expect(userService.getAllUsers).toHaveBeenCalledWith({
        search: undefined,
        role: undefined,
        page: 0,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc'
      });
    });

    it('should include search query when set', () => {
      component.searchQuery.set('john');
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));

      component.loadUsers();

      expect(userService.getAllUsers).toHaveBeenCalledWith(
        jasmine.objectContaining({ search: 'john' })
      );
    });

    it('should include role filter when set', () => {
      component.roleFilter.set('ADMIN');
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));

      component.loadUsers();

      expect(userService.getAllUsers).toHaveBeenCalledWith(
        jasmine.objectContaining({ role: 'ADMIN' })
      );
    });

    it('should handle error loading users', () => {
      const error = new Error('Failed to load');
      userService.getAllUsers.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.loadUsers();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Failed to load users');
      expect(console.error).toHaveBeenCalledWith('Error loading users:', error);
    });
  });

  describe('Search and Filters', () => {
    beforeEach(() => {
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));
    });

    it('should search users', () => {
      component.onSearchChange('john');

      expect(component.searchQuery()).toBe('john');
      expect(component.currentPage()).toBe(0);
      expect(userService.getAllUsers).toHaveBeenCalled();
    });

    it('should filter by role', () => {
      component.onRoleFilterChange('ADMIN');

      expect(component.roleFilter()).toBe('ADMIN');
      expect(component.currentPage()).toBe(0);
      expect(userService.getAllUsers).toHaveBeenCalled();
    });

    it('should clear all filters', () => {
      component.searchQuery.set('test');
      component.roleFilter.set('ADMIN');
      component.currentPage.set(2);

      component.clearFilters();

      expect(component.searchQuery()).toBe('');
      expect(component.roleFilter()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(userService.getAllUsers).toHaveBeenCalled();
    });
  });

  describe('Add User Modal', () => {
    it('should open add modal with empty form', () => {
      component.openAddModal();

      expect(component.showUserModal()).toBe(true);
      expect(component.isEditMode()).toBe(false);
      expect(component.userToEdit()).toBeNull();
      expect(component.formData()).toEqual({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'USER'
      });
    });

    it('should close user modal and reset form', () => {
      component.showUserModal.set(true);
      component.formData.set({
        username: 'test',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'pass',
        role: 'ADMIN'
      });

      component.closeUserModal();

      expect(component.showUserModal()).toBe(false);
      expect(component.formData()).toEqual({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'USER'
      });
    });
  });

  describe('Edit User Modal', () => {
    it('should open edit modal with user data', () => {
      component.openEditModal(mockUsers[0]);

      expect(component.showUserModal()).toBe(true);
      expect(component.isEditMode()).toBe(true);
      expect(component.userToEdit()).toEqual(mockUsers[0]);
      expect(component.formData()).toEqual({
        username: 'john_doe',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: '',
        role: 'USER'
      });
    });

    it('should handle user without role', () => {
      const userWithoutRole = { ...mockUsers[0], role: undefined };

      component.openEditModal(userWithoutRole);

      expect(component.formData().role).toBe('USER');
    });
  });

  describe('Save User - Create', () => {
    beforeEach(() => {
      component.isEditMode.set(false);
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));
    });

    it('should create new user successfully', fakeAsync(() => {
      component.formData.set({
        username: 'new_user',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        role: 'USER'
      });
      userService.createUser.and.returnValue(of(mockUsers[0]));

      component.saveUser();

      expect(userService.createUser).toHaveBeenCalledWith({
        username: 'new_user',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        role: 'USER'
      });
      expect(component.successMessage()).toBe('User created successfully');
      expect(component.showUserModal()).toBe(false);

      tick(3000);
      expect(component.successMessage()).toBeNull();
    }));

    it('should validate required fields', fakeAsync(() => {
      component.formData.set({
        username: '',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'pass',
        role: 'USER'
      });

      component.saveUser();

      expect(component.errorMessage()).toBe('Please fill in all required fields');
      expect(userService.createUser).not.toHaveBeenCalled();

      tick(3000);
      expect(component.errorMessage()).toBeNull();
    }));

    it('should require password for new users', fakeAsync(() => {
      component.formData.set({
        username: 'new_user',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        password: '',
        role: 'USER'
      });

      component.saveUser();

      expect(component.errorMessage()).toBe('Password is required for new users');
      expect(userService.createUser).not.toHaveBeenCalled();

      tick(3000);
      expect(component.errorMessage()).toBeNull();
    }));

    it('should handle create error with message', fakeAsync(() => {
      component.formData.set({
        username: 'new_user',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        role: 'USER'
      });
      const error = { error: { message: 'Username already exists' } };
      userService.createUser.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.saveUser();

      expect(component.errorMessage()).toBe('Username already exists');

      tick(3000);
      expect(component.errorMessage()).toBeNull();
    }));

    it('should handle create error without message', fakeAsync(() => {
      component.formData.set({
        username: 'new_user',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        role: 'USER'
      });
      const error = new Error('Network error');
      userService.createUser.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.saveUser();

      expect(component.errorMessage()).toBe('Failed to create user');

      tick(3000);
      expect(component.errorMessage()).toBeNull();
    }));
  });

  describe('Save User - Update', () => {
    beforeEach(() => {
      component.isEditMode.set(true);
      component.userToEdit.set(mockUsers[0]);
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));
    });

    it('should update existing user successfully', fakeAsync(() => {
      component.formData.set({
        username: 'john_updated',
        email: 'john.updated@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: '',
        role: 'ADMIN'
      });
      userService.updateUser.and.returnValue(of(mockUsers[0]));

      component.saveUser();

      expect(userService.updateUser).toHaveBeenCalledWith('1', {
        username: 'john_updated',
        email: 'john.updated@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMIN'
      });
      expect(component.successMessage()).toBe('User updated successfully');
      expect(component.showUserModal()).toBe(false);

      tick(3000);
      expect(component.successMessage()).toBeNull();
    }));

    it('should not update if user to edit is null', () => {
      component.userToEdit.set(null);
      component.formData.set({
        username: 'test',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        password: '',
        role: 'USER'
      });

      component.saveUser();

      expect(userService.updateUser).not.toHaveBeenCalled();
    });

    it('should handle update error', fakeAsync(() => {
      component.formData.set({
        username: 'john_updated',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: '',
        role: 'USER'
      });
      const error = { error: { message: 'Email already in use' } };
      userService.updateUser.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.saveUser();

      expect(component.errorMessage()).toBe('Email already in use');

      tick(3000);
      expect(component.errorMessage()).toBeNull();
    }));
  });

  describe('Delete User', () => {
    beforeEach(() => {
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));
    });

    it('should open delete modal', () => {
      component.openDeleteModal(mockUsers[0]);

      expect(component.showDeleteModal()).toBe(true);
      expect(component.userToDelete()).toEqual(mockUsers[0]);
    });

    it('should close delete modal', () => {
      component.showDeleteModal.set(true);
      component.userToDelete.set(mockUsers[0]);

      component.closeDeleteModal();

      expect(component.showDeleteModal()).toBe(false);
      expect(component.userToDelete()).toBeNull();
    });

    it('should delete user successfully', fakeAsync(() => {
      component.userToDelete.set(mockUsers[0]);
      userService.deleteUser.and.returnValue(of(void 0));

      component.confirmDelete();

      expect(userService.deleteUser).toHaveBeenCalledWith('1');
      expect(component.successMessage()).toBe('User deleted successfully');
      expect(component.showDeleteModal()).toBe(false);

      tick(3000);
      expect(component.successMessage()).toBeNull();
    }));

    it('should not delete if user is null', () => {
      component.userToDelete.set(null);

      component.confirmDelete();

      expect(userService.deleteUser).not.toHaveBeenCalled();
    });

    it('should handle delete error', fakeAsync(() => {
      component.userToDelete.set(mockUsers[0]);
      const error = new Error('Delete failed');
      userService.deleteUser.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.confirmDelete();

      expect(component.errorMessage()).toBe('Failed to delete user');
      expect(component.showDeleteModal()).toBe(false);

      tick(3000);
      expect(component.errorMessage()).toBeNull();
    }));
  });

  describe('Reset Password', () => {
    beforeEach(() => {
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));
    });

    it('should open reset password modal', () => {
      component.openResetPasswordModal(mockUsers[0]);

      expect(component.showResetPasswordModal()).toBe(true);
      expect(component.userToReset()).toEqual(mockUsers[0]);
      expect(component.newPassword()).toBe('');
      expect(component.showResetPassword()).toBe(false);
    });

    it('should close reset password modal', () => {
      component.showResetPasswordModal.set(true);
      component.userToReset.set(mockUsers[0]);
      component.newPassword.set('password');
      component.showResetPassword.set(true);

      component.closeResetPasswordModal();

      expect(component.showResetPasswordModal()).toBe(false);
      expect(component.userToReset()).toBeNull();
      expect(component.newPassword()).toBe('');
      expect(component.showResetPassword()).toBe(false);
    });

    it('should toggle password visibility', () => {
      component.showResetPassword.set(false);

      component.toggleResetPasswordVisibility();
      expect(component.showResetPassword()).toBe(true);

      component.toggleResetPasswordVisibility();
      expect(component.showResetPassword()).toBe(false);
    });

    it('should reset password successfully', fakeAsync(() => {
      component.userToReset.set(mockUsers[0]);
      component.newPassword.set('newPassword123');
      userService.resetPassword.and.returnValue(of(void 0));

      component.confirmResetPassword();

      expect(userService.resetPassword).toHaveBeenCalledWith('1', 'newPassword123');
      expect(component.successMessage()).toBe('Password reset successfully');
      expect(component.showResetPasswordModal()).toBe(false);

      tick(3000);
      expect(component.successMessage()).toBeNull();
    }));

    it('should validate password is not empty', fakeAsync(() => {
      component.userToReset.set(mockUsers[0]);
      component.newPassword.set('');

      component.confirmResetPassword();

      expect(component.errorMessage()).toBe('Please enter a new password');
      expect(userService.resetPassword).not.toHaveBeenCalled();

      tick(3000);
      expect(component.errorMessage()).toBeNull();
    }));

    it('should validate password minimum length', fakeAsync(() => {
      component.userToReset.set(mockUsers[0]);
      component.newPassword.set('12345');

      component.confirmResetPassword();

      expect(component.errorMessage()).toBe('Password must be at least 6 characters');
      expect(userService.resetPassword).not.toHaveBeenCalled();

      tick(3000);
      expect(component.errorMessage()).toBeNull();
    }));

    it('should handle reset password error', fakeAsync(() => {
      component.userToReset.set(mockUsers[0]);
      component.newPassword.set('newPassword123');
      const error = new Error('Reset failed');
      userService.resetPassword.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.confirmResetPassword();

      expect(component.errorMessage()).toBe('Failed to reset password');
      expect(component.showResetPasswordModal()).toBe(false);

      tick(3000);
      expect(component.errorMessage()).toBeNull();
    }));
  });

  describe('Role Badge Class', () => {
    it('should return correct class for ADMIN role', () => {
      expect(component.getRoleBadgeClass('ADMIN')).toBe('role-admin');
      expect(component.getRoleBadgeClass('admin')).toBe('role-admin');
    });

    it('should return correct class for USER role', () => {
      expect(component.getRoleBadgeClass('USER')).toBe('role-user');
      expect(component.getRoleBadgeClass('user')).toBe('role-user');
    });

    it('should return default class for unknown role', () => {
      expect(component.getRoleBadgeClass('UNKNOWN')).toBe('role-default');
      expect(component.getRoleBadgeClass(undefined)).toBe('role-default');
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly', () => {
      const result = component.formatDate('2025-12-31');
      expect(result).toContain('2025');
      expect(result).toContain('Dec');
    });

    it('should return dash for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('—');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));
    });

    it('should go to specific page', () => {
      const page2Response = { ...mockUsersResponse, currentPage: 2 };
      userService.getAllUsers.and.returnValue(of(page2Response));

      component.goToPage(2);

      expect(component.currentPage()).toBe(2);
      expect(userService.getAllUsers).toHaveBeenCalled();
    });

    it('should go to next page if has next', () => {
      const nextPageResponse = { ...mockUsersResponse, currentPage: 1 };
      userService.getAllUsers.and.returnValue(of(nextPageResponse));
      component.hasNext.set(true);
      component.currentPage.set(0);

      component.nextPage();

      expect(component.currentPage()).toBe(1);
      expect(userService.getAllUsers).toHaveBeenCalled();
    });

    it('should not go to next page if no next', () => {
      component.hasNext.set(false);
      component.currentPage.set(0);

      component.nextPage();

      expect(component.currentPage()).toBe(0);
      expect(userService.getAllUsers).not.toHaveBeenCalled();
    });

    it('should go to previous page if has previous', () => {
      const prevPageResponse = { ...mockUsersResponse, currentPage: 1 };
      userService.getAllUsers.and.returnValue(of(prevPageResponse));
      component.hasPrevious.set(true);
      component.currentPage.set(2);

      component.previousPage();

      expect(component.currentPage()).toBe(1);
      expect(userService.getAllUsers).toHaveBeenCalled();
    });

    it('should not go to previous page if no previous', () => {
      component.hasPrevious.set(false);
      component.currentPage.set(0);

      component.previousPage();

      expect(component.currentPage()).toBe(0);
      expect(userService.getAllUsers).not.toHaveBeenCalled();
    });

    it('should go to first page', () => {
      component.currentPage.set(5);

      component.goToFirstPage();

      expect(component.currentPage()).toBe(0);
      expect(userService.getAllUsers).toHaveBeenCalled();
    });

    it('should go to last page', () => {
      const lastPageResponse = { ...mockUsersResponse, currentPage: 9, totalPages: 10 };
      userService.getAllUsers.and.returnValue(of(lastPageResponse));
      component.totalPages.set(10);

      component.goToLastPage();

      expect(component.currentPage()).toBe(9);
      expect(userService.getAllUsers).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to admin dashboard', () => {
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should logout', () => {
      component.logout();
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full user search flow', () => {
      const searchResponse = {
        ...mockUsersResponse,
        users: [mockUsers[0]],
        totalItems: 1
      };
      userService.getAllUsers.and.returnValue(of(searchResponse));

      fixture.detectChanges();

      component.onSearchChange('john');

      expect(component.searchQuery()).toBe('john');
      expect(component.currentPage()).toBe(0);
      expect(component.users().length).toBe(1);
    });

    it('should complete full create flow', fakeAsync(() => {
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));
      userService.createUser.and.returnValue(of(mockUsers[0]));

      fixture.detectChanges();

      component.openAddModal();
      expect(component.showUserModal()).toBe(true);

      component.formData.set({
        username: 'new_user',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        role: 'USER'
      });

      component.saveUser();

      expect(component.successMessage()).toBe('User created successfully');
      expect(component.showUserModal()).toBe(false);

      tick(3000);
      expect(component.successMessage()).toBeNull();
    }));

    it('should complete full edit flow', fakeAsync(() => {
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));
      userService.updateUser.and.returnValue(of(mockUsers[0]));

      fixture.detectChanges();

      component.openEditModal(mockUsers[0]);
      expect(component.showUserModal()).toBe(true);
      expect(component.isEditMode()).toBe(true);

      component.formData.update(data => ({
        ...data,
        role: 'ADMIN'
      }));

      component.saveUser();

      expect(component.successMessage()).toBe('User updated successfully');

      tick(3000);
      expect(component.successMessage()).toBeNull();
    }));

    it('should complete full delete flow', fakeAsync(() => {
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));
      userService.deleteUser.and.returnValue(of(void 0));

      fixture.detectChanges();

      component.openDeleteModal(mockUsers[0]);
      expect(component.showDeleteModal()).toBe(true);

      component.confirmDelete();

      expect(component.successMessage()).toBe('User deleted successfully');
      expect(component.showDeleteModal()).toBe(false);

      tick(3000);
      expect(component.successMessage()).toBeNull();
    }));

    it('should complete full reset password flow', fakeAsync(() => {
      userService.getAllUsers.and.returnValue(of(mockUsersResponse));
      userService.resetPassword.and.returnValue(of(void 0));

      fixture.detectChanges();

      component.openResetPasswordModal(mockUsers[0]);
      expect(component.showResetPasswordModal()).toBe(true);

      component.newPassword.set('newPassword123');
      component.confirmResetPassword();

      expect(component.successMessage()).toBe('Password reset successfully');
      expect(component.showResetPasswordModal()).toBe(false);

      tick(3000);
      expect(component.successMessage()).toBeNull();
    }));
  });
});
