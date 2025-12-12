import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const email = this.forgotPasswordForm.value.email;

      this.authService.forgotPassword(email).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.successMessage.set('Reset code sent to your email. Redirecting...');
          setTimeout(() => {
            this.router.navigate(['/reset-password'], { queryParams: { email } });
          }, 1500);
        },
        error: (error) => {
          this.isLoading.set(false);
          if (error.error?.message) {
            this.errorMessage.set(error.error.message);
          } else if (error.status === 404) {
            this.errorMessage.set('Email not found');
          } else {
            this.errorMessage.set('Failed to send reset code. Please try again.');
          }
          console.error('Forgot password error:', error);
        }
      });
    } else {
      this.forgotPasswordForm.markAllAsTouched();
    }
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }
}
