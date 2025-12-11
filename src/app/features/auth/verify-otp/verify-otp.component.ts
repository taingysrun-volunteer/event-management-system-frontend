import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss']
})
export class VerifyOtpComponent implements OnInit {
  otpForm!: FormGroup;
  loading = false;
  error = '';
  success = '';
  email = '';
  resendCooldown = 0;
  private cooldownInterval?: number;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get email from query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.router.navigate(['/register']);
      }
    });

    this.otpForm = this.fb.group({
      otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/), Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const otpCode = this.otpForm.value.otpCode;

    this.authService.verifyOtp(this.email, otpCode).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'Email verified successfully! Redirecting to events...';

        // AuthService handles token storage
        setTimeout(() => {
          this.router.navigate(['/events']);
        }, 1500);
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 400) {
          this.error = 'Invalid or expired OTP code. Please try again.';
        } else {
          this.error = error.error?.message || 'Verification failed. Please try again.';
        }
      }
    });
  }

  resendOtp(): void {
    if (this.resendCooldown > 0) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.resendOtp(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'A new OTP code has been sent to your email.';
        this.startCooldown();

        // Clear success message after 5 seconds
        setTimeout(() => {
          this.success = '';
        }, 5000);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to resend OTP. Please try again.';
      }
    });
  }

  private startCooldown(): void {
    this.resendCooldown = 60; // 60 seconds cooldown

    this.cooldownInterval = window.setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        window.clearInterval(this.cooldownInterval);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      window.clearInterval(this.cooldownInterval);
    }
  }

  get otpCode() {
    return this.otpForm.get('otpCode');
  }

  // Helper method to format OTP input (auto-focus and formatting)
  onOtpInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, ''); // Remove non-digits
    input.value = value.slice(0, 6); // Limit to 6 digits
    this.otpForm.patchValue({ otpCode: input.value });
  }
}
