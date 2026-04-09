import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.scss'
})
export class VerifyOtpComponent implements OnInit {
  otpForm: FormGroup;
  error: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  isResending: boolean = false;
  email: string = '';
  resendDisabled: boolean = false;
  cooldownSeconds: number = 0;
  private cooldownInterval: any;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern('^[0-9]{6}$')]]
    });
  }

  ngOnInit() {
    this.email = this.authService.pendingVerificationEmail;
    if (!this.email) {
      this.router.navigate(['/login']);
    }
  }

  onVerify() {
    if (this.otpForm.invalid) return;
    this.isLoading = true;
    this.error = '';
    this.successMessage = '';

    this.authService.verifyOtp(this.email, this.otpForm.value.otp).subscribe({
      next: (res: any) => {
        this.successMessage = res.message || 'Email verified successfully!';
        this.isLoading = false;
        setTimeout(() => {
          this.authService.clearPendingEmail();
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Invalid or expired OTP. Please try again.';
        this.isLoading = false;
      }
    });
  }

  onResendOtp() {
    if (this.resendDisabled || this.isResending) return;
    this.isResending = true;
    this.error = '';
    this.successMessage = '';

    this.authService.resendOtp(this.email).subscribe({
      next: (res: any) => {
        this.successMessage = res.message || 'OTP resent successfully!';
        this.isResending = false;
        this.startCooldown();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to resend OTP.';
        this.isResending = false;
      }
    });
  }

  private startCooldown() {
    this.resendDisabled = true;
    this.cooldownSeconds = 30;
    this.cooldownInterval = setInterval(() => {
      this.cooldownSeconds--;
      if (this.cooldownSeconds <= 0) {
        this.resendDisabled = false;
        clearInterval(this.cooldownInterval);
      }
    }, 1000);
  }
}
