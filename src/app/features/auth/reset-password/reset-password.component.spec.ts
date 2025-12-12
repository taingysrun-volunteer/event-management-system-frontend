import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../../core/services/auth.service';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['resetPassword', 'forgotPassword']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      queryParams: of({ email: 'test@example.com' })
    };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.resetPasswordForm.get('otpCode')?.value).toBe('');
    expect(component.resetPasswordForm.get('password')?.value).toBe('');
    expect(component.resetPasswordForm.get('confirmPassword')?.value).toBe('');
  });

  it('should get email from query params', () => {
    expect(component.email).toBe('test@example.com');
  });

  it('should navigate to forgot-password if no email in query params', () => {
    mockActivatedRoute.queryParams = of({});
    const newComponent = new ResetPasswordComponent(
      TestBed.inject(ReactiveFormsModule) as any,
      mockAuthService,
      mockRouter,
      mockActivatedRoute
    );
    newComponent.ngOnInit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/forgot-password']);
  });

  it('should validate otpCode as required', () => {
    const otpCodeControl = component.resetPasswordForm.get('otpCode');
    otpCodeControl?.setValue('');
    expect(otpCodeControl?.hasError('required')).toBeTruthy();
  });

  it('should validate otpCode length', () => {
    const otpCodeControl = component.resetPasswordForm.get('otpCode');

    otpCodeControl?.setValue('123');
    expect(otpCodeControl?.hasError('minlength')).toBeTruthy();

    otpCodeControl?.setValue('1234567');
    expect(otpCodeControl?.hasError('maxlength')).toBeTruthy();

    otpCodeControl?.setValue('123456');
    expect(otpCodeControl?.valid).toBeTruthy();
  });

  it('should validate password as required and minimum length', () => {
    const passwordControl = component.resetPasswordForm.get('password');

    passwordControl?.setValue('');
    expect(passwordControl?.hasError('required')).toBeTruthy();

    passwordControl?.setValue('12345');
    expect(passwordControl?.hasError('minlength')).toBeTruthy();

    passwordControl?.setValue('123456');
    expect(passwordControl?.valid).toBeTruthy();
  });

  it('should validate password match', () => {
    component.resetPasswordForm.get('password')?.setValue('password123');
    component.resetPasswordForm.get('confirmPassword')?.setValue('password456');

    expect(component.resetPasswordForm.hasError('passwordMismatch')).toBeTruthy();

    component.resetPasswordForm.get('confirmPassword')?.setValue('password123');
    expect(component.resetPasswordForm.hasError('passwordMismatch')).toBeFalsy();
  });

  it('should not submit form when invalid', () => {
    component.resetPasswordForm.get('otpCode')?.setValue('');
    component.onSubmit();
    expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
  });

  it('should submit form when valid and navigate on success', (done) => {
    const otpCode = '123456';
    const password = 'newpassword123';
    const mockResponse = { message: 'Password reset successful' };

    mockAuthService.resetPassword.and.returnValue(of(mockResponse));

    component.resetPasswordForm.patchValue({
      otpCode,
      password,
      confirmPassword: password
    });

    component.onSubmit();

    expect(component.isLoading()).toBe(true);
    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
      component.email,
      otpCode,
      password
    );

    setTimeout(() => {
      expect(component.isLoading()).toBe(false);
      expect(component.successMessage()).toBe('Password reset successful! Redirecting to login...');
      expect(component.errorMessage()).toBeNull();
      done();
    }, 100);
  });

  it('should handle error for invalid reset code', (done) => {
    const mockError = { status: 400, error: { message: 'Invalid reset code' } };

    mockAuthService.resetPassword.and.returnValue(throwError(() => mockError));

    component.resetPasswordForm.patchValue({
      otpCode: '123456',
      password: 'newpassword123',
      confirmPassword: 'newpassword123'
    });

    component.onSubmit();

    setTimeout(() => {
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Invalid reset code');
      expect(component.successMessage()).toBeNull();
      done();
    }, 100);
  });

  it('should handle generic error', (done) => {
    const mockError = { status: 500, error: {} };

    mockAuthService.resetPassword.and.returnValue(throwError(() => mockError));

    component.resetPasswordForm.patchValue({
      otpCode: '123456',
      password: 'newpassword123',
      confirmPassword: 'newpassword123'
    });

    component.onSubmit();

    setTimeout(() => {
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Failed to reset password. Please try again.');
      done();
    }, 100);
  });

  it('should resend code successfully', (done) => {
    const mockResponse = { message: 'Code sent' };
    mockAuthService.forgotPassword.and.returnValue(of(mockResponse));

    component.resendCode();

    setTimeout(() => {
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(component.email);
      expect(component.successMessage()).toBe('New reset code sent to your email');
      expect(component.errorMessage()).toBeNull();
      done();
    }, 100);
  });

  it('should handle error when resending code', (done) => {
    const mockError = { status: 500, error: {} };
    mockAuthService.forgotPassword.and.returnValue(throwError(() => mockError));

    component.resendCode();

    setTimeout(() => {
      expect(component.errorMessage()).toBe('Failed to resend code. Please try again.');
      done();
    }, 100);
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(false);
  });

  it('should toggle confirm password visibility', () => {
    expect(component.showConfirmPassword()).toBe(false);
    component.toggleConfirmPasswordVisibility();
    expect(component.showConfirmPassword()).toBe(true);
    component.toggleConfirmPasswordVisibility();
    expect(component.showConfirmPassword()).toBe(false);
  });

  it('should navigate to login after successful password reset', (done) => {
    const mockResponse = { message: 'Password reset successful' };
    mockAuthService.resetPassword.and.returnValue(of(mockResponse));

    component.resetPasswordForm.patchValue({
      otpCode: '123456',
      password: 'newpassword123',
      confirmPassword: 'newpassword123'
    });

    component.onSubmit();

    setTimeout(() => {
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      done();
    }, 2100);
  });
});
