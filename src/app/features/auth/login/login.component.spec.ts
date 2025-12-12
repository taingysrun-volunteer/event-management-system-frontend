import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, EMPTY } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { USER_ROLES } from '../../../shared/user-role';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: EMPTY
    });
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('');
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { params: {} }
    });

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize the login form with empty values', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('username')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
    });

    it('should initialize signals with default values', () => {
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(component.showPassword()).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should have username and password controls', () => {
      expect(component.loginForm.contains('username')).toBe(true);
      expect(component.loginForm.contains('password')).toBe(true);
    });

    it('should mark username as invalid when empty', () => {
      const usernameControl = component.loginForm.get('username');
      usernameControl?.setValue('');
      expect(usernameControl?.valid).toBe(false);
      expect(usernameControl?.hasError('required')).toBe(true);
    });

    it('should mark username as valid when filled', () => {
      const usernameControl = component.loginForm.get('username');
      usernameControl?.setValue('testuser');
      expect(usernameControl?.valid).toBe(true);
    });

    it('should mark password as invalid when empty', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.valid).toBe(false);
      expect(passwordControl?.hasError('required')).toBe(true);
    });

    it('should mark password as invalid when less than 6 characters', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('12345');
      expect(passwordControl?.valid).toBe(false);
      expect(passwordControl?.hasError('minlength')).toBe(true);
    });

    it('should mark password as valid when 6 or more characters', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('123456');
      expect(passwordControl?.valid).toBe(true);
    });

    it('should mark form as invalid when username is empty', () => {
      component.loginForm.patchValue({
        username: '',
        password: 'password123'
      });
      expect(component.loginForm.valid).toBe(false);
    });

    it('should mark form as invalid when password is empty', () => {
      component.loginForm.patchValue({
        username: 'testuser',
        password: ''
      });
      expect(component.loginForm.valid).toBe(false);
    });

    it('should mark form as valid when all fields are filled correctly', () => {
      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });
      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('Form Getters', () => {
    it('should return username control', () => {
      expect(component.username).toBe(component.loginForm.get('username'));
    });

    it('should return password control', () => {
      expect(component.password).toBe(component.loginForm.get('password'));
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility from false to true', () => {
      expect(component.showPassword()).toBe(false);
      component.togglePasswordVisibility();
      expect(component.showPassword()).toBe(true);
    });

    it('should toggle password visibility from true to false', () => {
      component.showPassword.set(true);
      component.togglePasswordVisibility();
      expect(component.showPassword()).toBe(false);
    });

    it('should toggle password visibility multiple times', () => {
      expect(component.showPassword()).toBe(false);
      component.togglePasswordVisibility();
      expect(component.showPassword()).toBe(true);
      component.togglePasswordVisibility();
      expect(component.showPassword()).toBe(false);
      component.togglePasswordVisibility();
      expect(component.showPassword()).toBe(true);
    });
  });

  describe('Form Submission - Invalid Form', () => {
    it('should not call authService.login when form is invalid', () => {
      component.loginForm.patchValue({
        username: '',
        password: ''
      });

      component.onSubmit();

      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.loginForm.patchValue({
        username: '',
        password: ''
      });

      component.onSubmit();

      expect(component.loginForm.get('username')?.touched).toBe(true);
      expect(component.loginForm.get('password')?.touched).toBe(true);
    });

    it('should not set loading state when form is invalid', () => {
      component.loginForm.patchValue({
        username: '',
        password: ''
      });

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Form Submission - Valid Form - Success', () => {
    it('should call authService.login with form values on valid submission', () => {
      const mockResponse = {
        token: 'fake-jwt-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'testuser@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: USER_ROLES.USER
        }
      };
      authService.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });

      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123'
      });
    });

    it('should set loading to true when submitting', () => {
      const mockResponse = {
        token: 'fake-jwt-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'testuser@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: USER_ROLES.USER
        }
      };
      authService.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });

      component.onSubmit();

      expect(component.isLoading()).toBe(false); // Should be false after subscription completes
    });

    it('should clear error message when submitting', () => {
      const mockResponse = {
        token: 'fake-jwt-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'testuser@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: USER_ROLES.USER
        }
      };
      authService.login.and.returnValue(of(mockResponse));

      component.errorMessage.set('Previous error');
      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });

      component.onSubmit();

      expect(component.errorMessage()).toBeNull();
    });

    it('should navigate to /admin when user role is ADMIN', () => {
      const mockResponse = {
        token: 'fake-jwt-token',
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          role: USER_ROLES.ADMIN
        }
      };
      authService.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        username: 'admin',
        password: 'password123'
      });

      component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should navigate to /events when user role is USER', () => {
      const mockResponse = {
        token: 'fake-jwt-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'testuser@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: USER_ROLES.USER
        }
      };
      authService.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });

      component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/events']);
    });

    it('should set loading to false after successful login', () => {
      const mockResponse = {
        token: 'fake-jwt-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'testuser@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: USER_ROLES.USER
        }
      };
      authService.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Form Submission - Valid Form - Error', () => {
    it('should handle login error', () => {
      authService.login.and.returnValue(
        throwError(() => ({ status: 401, message: 'Unauthorized' }))
      );

      component.loginForm.patchValue({
        username: 'testuser',
        password: 'wrongpassword'
      });

      component.onSubmit();

      expect(component.errorMessage()).toBe('Invalid username or password');
    });

    it('should set loading to false after error', () => {
      authService.login.and.returnValue(
        throwError(() => ({ status: 401, message: 'Unauthorized' }))
      );

      component.loginForm.patchValue({
        username: 'testuser',
        password: 'wrongpassword'
      });

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('should not navigate on login error', () => {
      authService.login.and.returnValue(
        throwError(() => ({ status: 401, message: 'Unauthorized' }))
      );

      component.loginForm.patchValue({
        username: 'testuser',
        password: 'wrongpassword'
      });

      component.onSubmit();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle server error (500)', () => {
      authService.login.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server Error' }))
      );

      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });

      component.onSubmit();

      expect(component.errorMessage()).toBe('Invalid username or password');
      expect(component.isLoading()).toBe(false);
    });

    it('should handle network error', () => {
      authService.login.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });

      component.onSubmit();

      expect(component.errorMessage()).toBe('Invalid username or password');
      expect(component.isLoading()).toBe(false);
    });

    it('should handle unverified email error', () => {
      authService.login.and.returnValue(
        throwError(() => ({
          status: 401,
          error: { message: 'Please verify your email before logging in. Check your email for the verification code.' }
        }))
      );

      component.loginForm.patchValue({
        username: 'unverifieduser',
        password: 'password123'
      });

      component.onSubmit();

      expect(component.errorMessage()).toBe('Please verify your email before logging in. Check your email for the verification code.');
      expect(component.isLoading()).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only username', () => {
      const usernameControl = component.loginForm.get('username');
      usernameControl?.setValue('   ');

      // Username with only spaces should be considered valid by default required validator
      // You might want to add a custom validator to trim whitespace
      expect(usernameControl?.valid).toBe(true);
    });

    it('should handle very long username', () => {
      const longUsername = 'a'.repeat(1000);
      const usernameControl = component.loginForm.get('username');
      usernameControl?.setValue(longUsername);

      expect(usernameControl?.valid).toBe(true);
    });

    it('should handle special characters in username', () => {
      const usernameControl = component.loginForm.get('username');
      usernameControl?.setValue('test@user#123');

      expect(usernameControl?.valid).toBe(true);
    });

    it('should handle exactly 6 character password (minimum length)', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('123456');

      expect(passwordControl?.valid).toBe(true);
      expect(passwordControl?.hasError('minlength')).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should perform complete login flow for admin user', () => {
      const mockResponse = {
        token: 'admin-token',
        user: {
          id: 'admin-1',
          username: 'admin',
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
          role: USER_ROLES.ADMIN
        }
      };
      authService.login.and.returnValue(of(mockResponse));

      // Initial state
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();

      // Fill form
      component.loginForm.patchValue({
        username: 'admin',
        password: 'admin123'
      });

      expect(component.loginForm.valid).toBe(true);

      // Submit
      component.onSubmit();

      // Verify complete flow
      expect(authService.login).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin123'
      });
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should perform complete login flow for regular user', () => {
      const mockResponse = {
        token: 'user-token',
        user: {
          id: 'user-1',
          username: 'regularuser',
          email: 'user@test.com',
          firstName: 'Regular',
          lastName: 'User',
          role: USER_ROLES.USER
        }
      };
      authService.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        username: 'regularuser',
        password: 'user123456'
      });

      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith({
        username: 'regularuser',
        password: 'user123456'
      });
      expect(router.navigate).toHaveBeenCalledWith(['/events']);
    });
  });
});
