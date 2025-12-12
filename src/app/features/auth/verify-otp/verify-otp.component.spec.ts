import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, EMPTY } from 'rxjs';
import { VerifyOtpComponent } from './verify-otp.component';
import { AuthService } from '../../../core/services/auth.service';

describe('VerifyOtpComponent', () => {
  let component: VerifyOtpComponent;
  let fixture: ComponentFixture<VerifyOtpComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['verifyOtp', 'resendOtp']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: EMPTY
    });
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('');

    // Mock ActivatedRoute with queryParams observable
    activatedRoute = {
      queryParams: of({ email: 'test@example.com' }),
      snapshot: { queryParams: { email: 'test@example.com' } }
    };

    await TestBed.configureTestingModule({
      imports: [VerifyOtpComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyOtpComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize otpForm with empty otpCode', () => {
      expect(component.otpForm).toBeDefined();
      expect(component.otpForm.get('otpCode')?.value).toBe('');
    });

    it('should extract email from query params', () => {
      expect(component.email).toBe('test@example.com');
    });

    it('should redirect to register if no email in query params', () => {
      const noEmailRoute = {
        queryParams: of({}),
        snapshot: { queryParams: {} }
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [VerifyOtpComponent, ReactiveFormsModule],
        providers: [
          { provide: AuthService, useValue: authService },
          { provide: Router, useValue: router },
          { provide: ActivatedRoute, useValue: noEmailRoute }
        ]
      });

      const newFixture = TestBed.createComponent(VerifyOtpComponent);
      newFixture.detectChanges();

      expect(router.navigate).toHaveBeenCalledWith(['/register']);
    });

    it('should initialize with default state values', () => {
      expect(component.loading).toBe(false);
      expect(component.error).toBe('');
      expect(component.success).toBe('');
      expect(component.resendCooldown).toBe(0);
    });
  });

  describe('Form Validation', () => {
    it('should mark otpCode as invalid when empty', () => {
      const otpCodeControl = component.otpForm.get('otpCode');
      otpCodeControl?.setValue('');
      expect(otpCodeControl?.valid).toBe(false);
      expect(otpCodeControl?.hasError('required')).toBe(true);
    });

    it('should mark otpCode as invalid when less than 6 digits', () => {
      const otpCodeControl = component.otpForm.get('otpCode');
      otpCodeControl?.setValue('12345');
      expect(otpCodeControl?.valid).toBe(false);
      expect(otpCodeControl?.hasError('minlength')).toBe(true);
    });

    it('should mark otpCode as invalid when more than 6 digits', () => {
      const otpCodeControl = component.otpForm.get('otpCode');
      otpCodeControl?.setValue('1234567');
      expect(otpCodeControl?.valid).toBe(false);
      expect(otpCodeControl?.hasError('maxlength')).toBe(true);
    });

    it('should mark otpCode as invalid when contains non-digits', () => {
      const otpCodeControl = component.otpForm.get('otpCode');
      otpCodeControl?.setValue('12a456');
      expect(otpCodeControl?.valid).toBe(false);
      expect(otpCodeControl?.hasError('pattern')).toBe(true);
    });

    it('should mark otpCode as valid when exactly 6 digits', () => {
      const otpCodeControl = component.otpForm.get('otpCode');
      otpCodeControl?.setValue('123456');
      expect(otpCodeControl?.valid).toBe(true);
    });
  });

  describe('OTP Input Formatting', () => {
    it('should remove non-digit characters from input', () => {
      const inputEvent = {
        target: { value: 'abc123def' }
      } as any;

      component.onOtpInput(inputEvent);

      expect(inputEvent.target.value).toBe('123');
    });

    it('should limit input to 6 digits', () => {
      const inputEvent = {
        target: { value: '1234567890' }
      } as any;

      component.onOtpInput(inputEvent);

      expect(inputEvent.target.value).toBe('123456');
    });

    it('should handle empty input', () => {
      const inputEvent = {
        target: { value: '' }
      } as any;

      component.onOtpInput(inputEvent);

      expect(inputEvent.target.value).toBe('');
    });

    it('should handle special characters', () => {
      const inputEvent = {
        target: { value: '!@#$%^' }
      } as any;

      component.onOtpInput(inputEvent);

      expect(inputEvent.target.value).toBe('');
    });
  });

  describe('Form Submission - Invalid Form', () => {
    it('should not call verifyOtp when form is invalid', () => {
      component.otpForm.patchValue({ otpCode: '' });
      component.onSubmit();

      expect(authService.verifyOtp).not.toHaveBeenCalled();
    });

    it('should mark form as touched when invalid', () => {
      component.otpForm.patchValue({ otpCode: '123' });
      component.onSubmit();

      expect(component.otpForm.get('otpCode')?.touched).toBe(true);
    });
  });

  describe('Form Submission - Success', () => {
    const mockSuccessResponse = {
      token: 'mock-jwt-token',
      user: {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      }
    };

    it('should call verifyOtp with email and otpCode', () => {
      authService.verifyOtp.and.returnValue(of(mockSuccessResponse));

      component.otpForm.patchValue({ otpCode: '123456' });
      component.onSubmit();

      expect(authService.verifyOtp).toHaveBeenCalledWith('test@example.com', '123456');
    });

    it('should set loading to true during verification', () => {
      authService.verifyOtp.and.returnValue(of(mockSuccessResponse));

      component.otpForm.patchValue({ otpCode: '123456' });
      component.onSubmit();

      expect(component.loading).toBe(false); // After completion
    });

    it('should clear error and set success message', () => {
      authService.verifyOtp.and.returnValue(of(mockSuccessResponse));

      component.error = 'Previous error';
      component.otpForm.patchValue({ otpCode: '123456' });
      component.onSubmit();

      expect(component.error).toBe('');
      expect(component.success).toBe('Email verified successfully! Redirecting to events...');
    });

    it('should navigate to /events after 1.5 seconds', fakeAsync(() => {
      authService.verifyOtp.and.returnValue(of(mockSuccessResponse));

      component.otpForm.patchValue({ otpCode: '123456' });
      component.onSubmit();

      expect(router.navigate).not.toHaveBeenCalled();

      tick(1500);

      expect(router.navigate).toHaveBeenCalledWith(['/events']);
    }));

    it('should set loading to false after success', () => {
      authService.verifyOtp.and.returnValue(of(mockSuccessResponse));

      component.otpForm.patchValue({ otpCode: '123456' });
      component.onSubmit();

      expect(component.loading).toBe(false);
    });
  });

  describe('Form Submission - Error Handling', () => {
    it('should handle 400 error (invalid OTP)', () => {
      const errorResponse = {
        status: 400,
        error: { message: 'Invalid OTP' }
      };
      authService.verifyOtp.and.returnValue(throwError(() => errorResponse));

      component.otpForm.patchValue({ otpCode: '999999' });
      component.onSubmit();

      expect(component.error).toBe('Invalid or expired OTP code. Please try again.');
      expect(component.loading).toBe(false);
    });

    it('should handle generic error', () => {
      const errorResponse = {
        status: 500,
        error: { message: 'Server error' }
      };
      authService.verifyOtp.and.returnValue(throwError(() => errorResponse));

      component.otpForm.patchValue({ otpCode: '123456' });
      component.onSubmit();

      expect(component.error).toBe('Server error');
      expect(component.loading).toBe(false);
    });

    it('should handle error without message', () => {
      const errorResponse = { status: 500 };
      authService.verifyOtp.and.returnValue(throwError(() => errorResponse));

      component.otpForm.patchValue({ otpCode: '123456' });
      component.onSubmit();

      expect(component.error).toBe('Verification failed. Please try again.');
      expect(component.loading).toBe(false);
    });

    it('should not navigate on error', () => {
      const errorResponse = { status: 400 };
      authService.verifyOtp.and.returnValue(throwError(() => errorResponse));

      component.otpForm.patchValue({ otpCode: '123456' });
      component.onSubmit();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should clear success message on error', () => {
      const errorResponse = { status: 400 };
      authService.verifyOtp.and.returnValue(throwError(() => errorResponse));

      component.success = 'Previous success';
      component.otpForm.patchValue({ otpCode: '123456' });
      component.onSubmit();

      expect(component.success).toBe('');
    });
  });

  describe('Resend OTP', () => {
    const mockResendResponse = {
      message: 'A new verification code has been sent to your email.',
      email: 'test@example.com'
    };

    it('should not resend if cooldown is active', () => {
      component.resendCooldown = 30;
      component.resendOtp();

      expect(authService.resendOtp).not.toHaveBeenCalled();
    });

    it('should call resendOtp with email', () => {
      authService.resendOtp.and.returnValue(of(mockResendResponse));

      component.resendOtp();

      expect(authService.resendOtp).toHaveBeenCalledWith('test@example.com');
    });

    it('should set success message on resend', () => {
      authService.resendOtp.and.returnValue(of(mockResendResponse));

      component.resendOtp();

      expect(component.success).toBe('A new OTP code has been sent to your email.');
    });

    it('should start cooldown timer after resend', fakeAsync(() => {
      authService.resendOtp.and.returnValue(of(mockResendResponse));

      component.resendOtp();

      expect(component.resendCooldown).toBe(60);

      tick(1000);
      expect(component.resendCooldown).toBe(59);

      tick(59000);
      expect(component.resendCooldown).toBe(0);
    }));

    it('should clear success message after 5 seconds', fakeAsync(() => {
      authService.resendOtp.and.returnValue(of(mockResendResponse));

      component.resendOtp();

      expect(component.success).toBe('A new OTP code has been sent to your email.');

      tick(5000);

      expect(component.success).toBe('');
    }));

    it('should handle resend error', () => {
      const errorResponse = {
        error: { message: 'Email already verified' }
      };
      authService.resendOtp.and.returnValue(throwError(() => errorResponse));

      component.resendOtp();

      expect(component.error).toBe('Email already verified');
      expect(component.loading).toBe(false);
    });

    it('should handle resend error without message', () => {
      const errorResponse = { status: 500 };
      authService.resendOtp.and.returnValue(throwError(() => errorResponse));

      component.resendOtp();

      expect(component.error).toBe('Failed to resend OTP. Please try again.');
      expect(component.loading).toBe(false);
    });

    it('should set loading state during resend', () => {
      authService.resendOtp.and.returnValue(of(mockResendResponse));

      component.resendOtp();

      expect(component.loading).toBe(false); // After completion
    });
  });

  describe('Getters', () => {
    it('should return otpCode control', () => {
      expect(component.otpCode).toBe(component.otpForm.get('otpCode'));
    });
  });

  describe('Component Cleanup', () => {
    it('should clear cooldown interval on destroy', fakeAsync(() => {
      authService.resendOtp.and.returnValue(of({
        message: 'Success',
        email: 'test@example.com'
      }));

      component.resendOtp();
      expect(component.resendCooldown).toBe(60);

      component.ngOnDestroy();

      tick(10000);

      // Cooldown should not decrease after destroy
      expect(component.resendCooldown).toBeGreaterThan(0);
    }));
  });

  describe('Integration Tests', () => {
    it('should perform complete OTP verification flow', fakeAsync(() => {
      const mockResponse = {
        token: 'jwt-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'USER'
        }
      };
      authService.verifyOtp.and.returnValue(of(mockResponse));

      // Initial state
      expect(component.loading).toBe(false);
      expect(component.error).toBe('');
      expect(component.success).toBe('');

      // Fill OTP
      component.otpForm.patchValue({ otpCode: '123456' });
      expect(component.otpForm.valid).toBe(true);

      // Submit
      component.onSubmit();

      // Verify API call
      expect(authService.verifyOtp).toHaveBeenCalledWith('test@example.com', '123456');

      // Verify success state
      expect(component.loading).toBe(false);
      expect(component.error).toBe('');
      expect(component.success).toBe('Email verified successfully! Redirecting to events...');

      // Fast-forward time
      tick(1500);

      // Verify navigation
      expect(router.navigate).toHaveBeenCalledWith(['/events']);
    }));

    it('should handle complete resend OTP flow', fakeAsync(() => {
      const mockResponse = {
        message: 'OTP sent',
        email: 'test@example.com'
      };
      authService.resendOtp.and.returnValue(of(mockResponse));

      // Initial state
      expect(component.resendCooldown).toBe(0);

      // Resend OTP
      component.resendOtp();

      // Verify API call
      expect(authService.resendOtp).toHaveBeenCalledWith('test@example.com');

      // Verify success message
      expect(component.success).toContain('sent');

      // Verify cooldown started
      expect(component.resendCooldown).toBe(60);

      // Verify can't resend during cooldown
      component.resendOtp();
      expect(authService.resendOtp).toHaveBeenCalledTimes(1); // Still only called once

      // Wait for cooldown to finish
      tick(60000);
      expect(component.resendCooldown).toBe(0);

      // Should be able to resend again
      component.resendOtp();
      expect(authService.resendOtp).toHaveBeenCalledTimes(2);
    }));
  });
});
