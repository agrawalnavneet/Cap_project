import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

/** Validates GSTIN format: 2-digit state + 5-char PAN letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric */
function gstinValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return pattern.test(control.value.toUpperCase()) ? null : { invalidGstin: true };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  error = '';
  successMessage = '';
  isLoading = false;
  isRegisterMode = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['admin@cocacola.com', [Validators.required, Validators.email]],
      password: ['admin123', [Validators.required]]
    });

    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      enterpriseName: ['', [Validators.required, Validators.minLength(2)]],
      gstinNumber: ['', [Validators.required, gstinValidator]],
      contactNumber: [''],
      address: ['']
    });
  }

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.error = '';
    this.successMessage = '';
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    this.error = '';
    this.authService.login(this.loginForm.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error = err.error?.message || 'Invalid credentials or server unreachable.';
        this.isLoading = false;
      }
    });
  }

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.error = '';

    const data = {
      ...this.registerForm.value,
      gstinNumber: this.registerForm.value.gstinNumber?.toUpperCase()
    };

    this.authService.register(data).subscribe({
      next: (res: any) => {
        this.successMessage = res.message || 'Registration successful! Redirecting to OTP verification...';
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/verify-otp']), 1500);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Convenience getters for template
  get f() { return this.registerForm.controls; }
}
