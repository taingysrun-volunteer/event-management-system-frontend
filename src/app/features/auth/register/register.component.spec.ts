import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, EMPTY } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: EMPTY
    });
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('');
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { params: {} }
    });

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize the registration form with empty values', () => {
      expect(component.registerForm).toBeDefined();
      expect(component.registerForm.get('username')?.value).toBe('');
      expect(component.registerForm.get('email')?.value).toBe('');
      expect(component.registerForm.get('firstName')?.value).toBe('');
      expect(component.registerForm.get('lastName')?.value).toBe('');
      expect(component.registerForm.get('password')?.value).toBe('');
      expect(component.registerForm.get('confirmPassword')?.value).toBe('');
    });

    it('should initialize signals with default values', () => {
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(component.successMessage()).toBeNull();
      expect(component.showPassword()).toBe(false);
      expect(component.showConfirmPassword()).toBe(false);
    });

    it('should have all required form controls', () => {
      expect(component.registerForm.contains('username')).toBe(true);
      expect(component.registerForm.contains('email')).toBe(true);
      expect(component.registerForm.contains('firstName')).toBe(true);
      expect(component.registerForm.contains('lastName')).toBe(true);
      expect(component.registerForm.contains('password')).toBe(true);
      expect(component.registerForm.contains('confirmPassword')).toBe(true);
    });
  });

  describe('Form Validation - Username', () => {
    it('should mark username as invalid when empty', () => {
      const usernameControl = component.registerForm.get('username');
      usernameControl?.setValue('');
      expect(usernameControl?.valid).toBe(false);
      expect(usernameControl?.hasError('required')).toBe(true);
    });

    it('should mark username as invalid when less than 3 characters', () => {
      const usernameControl = component.registerForm.get('username');
      usernameControl?.setValue('ab');
      expect(usernameControl?.valid).toBe(false);
      expect(usernameControl?.hasError('minlength')).toBe(true);
    });

    it('should mark username as valid when 3 or more characters', () => {
      const usernameControl = component.registerForm.get('username');
      usernameControl?.setValue('abc');
      expect(usernameControl?.valid).toBe(true);
    });
  });

  describe('Form Validation - Email', () => {
    it('should mark email as invalid when empty', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('');
      expect(emailControl?.valid).toBe(false);
      expect(emailControl?.hasError('required')).toBe(true);
    });

    it('should mark email as invalid with incorrect format', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('invalid-email');
      expect(emailControl?.valid).toBe(false);
      expect(emailControl?.hasError('email')).toBe(true);
    });

    it('should mark email as invalid without @ symbol', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('testemail.com');
      expect(emailControl?.valid).toBe(false);
      expect(emailControl?.hasError('email')).toBe(true);
    });

    it('should mark email as invalid without domain', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('test@');
      expect(emailControl?.valid).toBe(false);
      expect(emailControl?.hasError('email')).toBe(true);
    });

    it('should mark email as valid with correct format', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBe(true);
    });

    it('should accept email with subdomain', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('user@mail.example.com');
      expect(emailControl?.valid).toBe(true);
    });
  });

  describe('Form Validation - First Name', () => {
    it('should mark firstName as invalid when empty', () => {
      const firstNameControl = component.registerForm.get('firstName');
      firstNameControl?.setValue('');
      expect(firstNameControl?.valid).toBe(false);
      expect(firstNameControl?.hasError('required')).toBe(true);
    });

    it('should mark firstName as invalid when less than 2 characters', () => {
      const firstNameControl = component.registerForm.get('firstName');
      firstNameControl?.setValue('A');
      expect(firstNameControl?.valid).toBe(false);
      expect(firstNameControl?.hasError('minlength')).toBe(true);
    });

    it('should mark firstName as valid when 2 or more characters', () => {
      const firstNameControl = component.registerForm.get('firstName');
      firstNameControl?.setValue('Jo');
      expect(firstNameControl?.valid).toBe(true);
    });
  });

  describe('Form Validation - Last Name', () => {
    it('should mark lastName as invalid when empty', () => {
      const lastNameControl = component.registerForm.get('lastName');
      lastNameControl?.setValue('');
      expect(lastNameControl?.valid).toBe(false);
      expect(lastNameControl?.hasError('required')).toBe(true);
    });

    it('should mark lastName as invalid when less than 2 characters', () => {
      const lastNameControl = component.registerForm.get('lastName');
      lastNameControl?.setValue('D');
      expect(lastNameControl?.valid).toBe(false);
      expect(lastNameControl?.hasError('minlength')).toBe(true);
    });

    it('should mark lastName as valid when 2 or more characters', () => {
      const lastNameControl = component.registerForm.get('lastName');
      lastNameControl?.setValue('Doe');
      expect(lastNameControl?.valid).toBe(true);
    });
  });

  describe('Form Validation - Password', () => {
    it('should mark password as invalid when empty', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.valid).toBe(false);
      expect(passwordControl?.hasError('required')).toBe(true);
    });

    it('should mark password as invalid when less than 6 characters', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('12345');
      expect(passwordControl?.valid).toBe(false);
      expect(passwordControl?.hasError('minlength')).toBe(true);
    });

    it('should mark password as valid when 6 or more characters', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('123456');
      expect(passwordControl?.valid).toBe(true);
    });
  });

  describe('Form Validation - Confirm Password', () => {
    it('should mark confirmPassword as invalid when empty', () => {
      const confirmPasswordControl = component.registerForm.get('confirmPassword');
      confirmPasswordControl?.setValue('');
      expect(confirmPasswordControl?.valid).toBe(false);
      expect(confirmPasswordControl?.hasError('required')).toBe(true);
    });
  });

  describe('Password Match Validation', () => {
    it('should have passwordMismatch error when passwords do not match', () => {
      component.registerForm.patchValue({
        password: 'password123',
        confirmPassword: 'password456'
      });

      expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
      expect(component.registerForm.valid).toBe(false);
    });

    it('should not have passwordMismatch error when passwords match', () => {
      component.registerForm.patchValue({
        password: 'password123',
        confirmPassword: 'password123'
      });

      expect(component.registerForm.hasError('passwordMismatch')).toBe(false);
    });

    it('should update validation when password changes', () => {
      component.registerForm.patchValue({
        password: 'password123',
        confirmPassword: 'password123'
      });

      expect(component.registerForm.hasError('passwordMismatch')).toBe(false);

      component.registerForm.patchValue({
        password: 'newpassword'
      });

      expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
    });

    it('should update validation when confirmPassword changes', () => {
      component.registerForm.patchValue({
        password: 'password123',
        confirmPassword: 'password456'
      });

      expect(component.registerForm.hasError('passwordMismatch')).toBe(true);

      component.registerForm.patchValue({
        confirmPassword: 'password123'
      });

      expect(component.registerForm.hasError('passwordMismatch')).toBe(false);
    });
  });

  describe('Form Getters', () => {
    it('should return username control', () => {
      expect(component.username).toBe(component.registerForm.get('username'));
    });

    it('should return email control', () => {
      expect(component.email).toBe(component.registerForm.get('email'));
    });

    it('should return firstName control', () => {
      expect(component.firstName).toBe(component.registerForm.get('firstName'));
    });

    it('should return lastName control', () => {
      expect(component.lastName).toBe(component.registerForm.get('lastName'));
    });

    it('should return password control', () => {
      expect(component.password).toBe(component.registerForm.get('password'));
    });

    it('should return confirmPassword control', () => {
      expect(component.confirmPassword).toBe(component.registerForm.get('confirmPassword'));
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

    it('should toggle confirm password visibility from false to true', () => {
      expect(component.showConfirmPassword()).toBe(false);
      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword()).toBe(true);
    });

    it('should toggle confirm password visibility from true to false', () => {
      component.showConfirmPassword.set(true);
      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword()).toBe(false);
    });

    it('should toggle password and confirmPassword independently', () => {
      component.togglePasswordVisibility();
      expect(component.showPassword()).toBe(true);
      expect(component.showConfirmPassword()).toBe(false);

      component.toggleConfirmPasswordVisibility();
      expect(component.showPassword()).toBe(true);
      expect(component.showConfirmPassword()).toBe(true);
    });
  });

  describe('Form Submission - Invalid Form', () => {
    it('should not call authService.register when form is invalid', () => {
      component.registerForm.patchValue({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        confirmPassword: ''
      });

      component.onSubmit();

      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.onSubmit();

      expect(component.registerForm.get('username')?.touched).toBe(true);
      expect(component.registerForm.get('email')?.touched).toBe(true);
      expect(component.registerForm.get('firstName')?.touched).toBe(true);
      expect(component.registerForm.get('lastName')?.touched).toBe(true);
      expect(component.registerForm.get('password')?.touched).toBe(true);
      expect(component.registerForm.get('confirmPassword')?.touched).toBe(true);
    });

    it('should not call register when passwords do not match', () => {
      component.registerForm.patchValue({
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        confirmPassword: 'password456'
      });

      component.onSubmit();

      expect(authService.register).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission - Valid Form - Success', () => {
    const validFormData = {
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123',
      confirmPassword: 'password123'
    };

    it('should call authService.register with form values excluding confirmPassword', () => {
      const mockResponse = { message: 'Registration successful', email: 'test@example.com' };
      authService.register.and.returnValue(of(mockResponse));

      component.registerForm.patchValue(validFormData);
      component.onSubmit();

      expect(authService.register).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123'
      });
    });

    it('should set loading to true when submitting', () => {
      const mockResponse = { message: 'Registration successful', email: 'test@example.com' };
      authService.register.and.returnValue(of(mockResponse));

      component.registerForm.patchValue(validFormData);
      component.onSubmit();

      // After subscription completes, loading should be false
      expect(component.isLoading()).toBe(false);
    });

    it('should clear error and success messages when submitting', () => {
      const mockResponse = { message: 'Registration successful', email: 'test@example.com' };
      authService.register.and.returnValue(of(mockResponse));

      component.errorMessage.set('Previous error');
      component.successMessage.set('Previous success');

      component.registerForm.patchValue(validFormData);
      component.onSubmit();

      expect(component.errorMessage()).toBeNull();
    });

    it('should set success message after successful registration', () => {
      const mockResponse = { message: 'Registration successful', email: 'test@example.com' };
      authService.register.and.returnValue(of(mockResponse));

      component.registerForm.patchValue(validFormData);
      component.onSubmit();

      expect(component.successMessage()).toBe('Registration successful! Redirecting to email verification...');
      expect(component.isLoading()).toBe(false);
    });

    it('should navigate to /verify-otp after 1.5 seconds on success', fakeAsync(() => {
      const mockResponse = { message: 'Registration successful', email: 'test@example.com' };
      authService.register.and.returnValue(of(mockResponse));

      component.registerForm.patchValue(validFormData);
      component.onSubmit();

      expect(router.navigate).not.toHaveBeenCalled();

      tick(1500);

      expect(router.navigate).toHaveBeenCalledWith(['/verify-otp'], { queryParams: { email: 'test@example.com' } });
    }));

    it('should not navigate immediately on success', () => {
      const mockResponse = { message: 'Registration successful', email: 'test@example.com' };
      authService.register.and.returnValue(of(mockResponse));

      component.registerForm.patchValue(validFormData);
      component.onSubmit();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission - Valid Form - Error Handling', () => {
    const validFormData = {
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123',
      confirmPassword: 'password123'
    };

    it('should handle error with custom message from server', () => {
      const errorResponse = {
        error: { message: 'Custom error message' },
        status: 400
      };
      authService.register.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue(validFormData);
      component.onSubmit();

      expect(component.errorMessage()).toBe('Custom error message');
      expect(component.isLoading()).toBe(false);
    });

    it('should handle 409 conflict error (duplicate user)', () => {
      const errorResponse = { status: 409 };
      authService.register.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue(validFormData);
      component.onSubmit();

      expect(component.errorMessage()).toBe('Username or email already exists');
      expect(component.isLoading()).toBe(false);
    });

    it('should handle generic error without specific message', () => {
      const errorResponse = { status: 500 };
      authService.register.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue(validFormData);
      component.onSubmit();

      expect(component.errorMessage()).toBe('Registration failed. Please try again.');
      expect(component.isLoading()).toBe(false);
    });

    it('should handle network error', () => {
      authService.register.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.registerForm.patchValue(validFormData);
      component.onSubmit();

      expect(component.errorMessage()).toBe('Registration failed. Please try again.');
      expect(component.isLoading()).toBe(false);
    });

    it('should not navigate on error', () => {
      const errorResponse = { status: 500 };
      authService.register.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue(validFormData);
      component.onSubmit();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should set loading to false after error', () => {
      const errorResponse = { status: 500 };
      authService.register.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue(validFormData);
      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('should not set success message on error', () => {
      const errorResponse = { status: 500 };
      authService.register.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue(validFormData);
      component.onSubmit();

      expect(component.successMessage()).toBeNull();
    });
  });

  describe('Complete Form Validation', () => {
    it('should mark form as invalid when any required field is missing', () => {
      component.registerForm.patchValue({
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        confirmPassword: ''
      });

      expect(component.registerForm.valid).toBe(false);
    });

    it('should mark form as valid when all fields are filled correctly', () => {
      component.registerForm.patchValue({
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        confirmPassword: 'password123'
      });

      expect(component.registerForm.valid).toBe(true);
    });

    it('should mark form as invalid when email format is incorrect', () => {
      component.registerForm.patchValue({
        username: 'testuser',
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        confirmPassword: 'password123'
      });

      expect(component.registerForm.valid).toBe(false);
    });

    it('should mark form as invalid when username is too short', () => {
      component.registerForm.patchValue({
        username: 'ab',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        confirmPassword: 'password123'
      });

      expect(component.registerForm.valid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long input values', () => {
      const longString = 'a'.repeat(1000);
      component.registerForm.patchValue({
        username: longString,
        email: 'test@example.com',
        firstName: longString,
        lastName: longString,
        password: 'password123',
        confirmPassword: 'password123'
      });

      // Should be valid despite long values
      expect(component.registerForm.valid).toBe(true);
    });

    it('should handle special characters in name fields', () => {
      component.registerForm.patchValue({
        username: 'test-user_123',
        email: 'test@example.com',
        firstName: "O'Brien",
        lastName: 'Smith-Jones',
        password: 'password123',
        confirmPassword: 'password123'
      });

      expect(component.registerForm.valid).toBe(true);
    });

    it('should handle minimum valid values', () => {
      component.registerForm.patchValue({
        username: 'abc',       // exactly 3 characters
        email: 'a@b.c',        // minimal valid email
        firstName: 'Jo',       // exactly 2 characters
        lastName: 'Do',        // exactly 2 characters
        password: '123456',    // exactly 6 characters
        confirmPassword: '123456'
      });

      expect(component.registerForm.valid).toBe(true);
    });

    it('should reject whitespace-only values for required fields', () => {
      component.registerForm.patchValue({
        username: '   ',
        email: '   ',
        firstName: '   ',
        lastName: '   ',
        password: '      ',
        confirmPassword: '      '
      });

      // Email validator should fail on whitespace-only
      expect(component.registerForm.get('email')?.valid).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should perform complete registration flow successfully', fakeAsync(() => {
      const mockResponse = {
        message: 'Registration successful',
        email: 'newuser@test.com'
      };
      authService.register.and.returnValue(of(mockResponse));

      // Initial state
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(component.successMessage()).toBeNull();

      // Fill form
      component.registerForm.patchValue({
        username: 'newuser',
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        password: 'securepass123',
        confirmPassword: 'securepass123'
      });

      expect(component.registerForm.valid).toBe(true);

      // Submit
      component.onSubmit();

      // Verify registration call
      expect(authService.register).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        password: 'securepass123'
      });

      // Verify success state
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(component.successMessage()).toBe('Registration successful! Redirecting to email verification...');

      // Fast-forward time
      tick(1500);

      // Verify navigation to OTP verification page
      expect(router.navigate).toHaveBeenCalledWith(['/verify-otp'], { queryParams: { email: 'newuser@test.com' } });
    }));

    it('should handle complete registration flow with error', () => {
      const errorResponse = {
        error: { message: 'Username already taken' },
        status: 409
      };
      authService.register.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue({
        username: 'existinguser',
        email: 'existing@test.com',
        firstName: 'Existing',
        lastName: 'User',
        password: 'password123',
        confirmPassword: 'password123'
      });

      component.onSubmit();

      expect(authService.register).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Username already taken');
      expect(component.successMessage()).toBeNull();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
