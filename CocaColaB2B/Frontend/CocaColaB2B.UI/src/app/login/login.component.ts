import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

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
  error: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  isRegisterMode: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['admin@cocacola.com', [Validators.required, Validators.email]],
      password: ['admin123', [Validators.required]]
    });

    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
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
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = 'Invalid credentials or server unreachable.';
        this.isLoading = false;
      }
    });
  }

  onRegister() {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.error = '';

    const data = {
      ...this.registerForm.value,
      role: 'Wholesaler'
    };

    this.authService.register(data).subscribe({
      next: () => {
        this.successMessage = 'Registration successful! Redirecting...';
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
