import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../core/services/auth.service';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['forgotPassword']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty email', () => {
    expect(component.forgotPasswordForm.get('email')?.value).toBe('');
  });

  it('should validate email as required', () => {
    const emailControl = component.forgotPasswordForm.get('email');
    emailControl?.setValue('');
    expect(emailControl?.hasError('required')).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.forgotPasswordForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();

    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should not submit form when invalid', () => {
    component.forgotPasswordForm.get('email')?.setValue('');
    component.onSubmit();
    expect(mockAuthService.forgotPassword).not.toHaveBeenCalled();
  });

  it('should submit form when valid and navigate on success', (done) => {
    const email = 'test@example.com';
    const mockResponse = { message: 'Reset code sent' };

    mockAuthService.forgotPassword.and.returnValue(of(mockResponse));
    component.forgotPasswordForm.get('email')?.setValue(email);

    component.onSubmit();

    expect(component.isLoading()).toBe(true);
    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(email);

    setTimeout(() => {
      expect(component.isLoading()).toBe(false);
      expect(component.successMessage()).toBe('Reset code sent to your email. Redirecting...');
      expect(component.errorMessage()).toBeNull();
      done();
    }, 100);
  });

  it('should handle error when email not found', (done) => {
    const email = 'notfound@example.com';
    const mockError = { status: 404, error: { message: 'Email not found' } };

    mockAuthService.forgotPassword.and.returnValue(throwError(() => mockError));
    component.forgotPasswordForm.get('email')?.setValue(email);

    component.onSubmit();

    setTimeout(() => {
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Email not found');
      expect(component.successMessage()).toBeNull();
      done();
    }, 100);
  });

  it('should handle generic error', (done) => {
    const email = 'test@example.com';
    const mockError = { status: 500, error: {} };

    mockAuthService.forgotPassword.and.returnValue(throwError(() => mockError));
    component.forgotPasswordForm.get('email')?.setValue(email);

    component.onSubmit();

    setTimeout(() => {
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Failed to send reset code. Please try again.');
      done();
    }, 100);
  });

  it('should mark all fields as touched when form is invalid', () => {
    component.onSubmit();
    expect(component.forgotPasswordForm.get('email')?.touched).toBeTruthy();
  });

  it('should navigate to reset-password page after successful submission', (done) => {
    const email = 'test@example.com';
    const mockResponse = { message: 'Reset code sent' };

    mockAuthService.forgotPassword.and.returnValue(of(mockResponse));
    component.forgotPasswordForm.get('email')?.setValue(email);

    component.onSubmit();

    setTimeout(() => {
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/reset-password'],
        { queryParams: { email } }
      );
      done();
    }, 1600);
  });
});
