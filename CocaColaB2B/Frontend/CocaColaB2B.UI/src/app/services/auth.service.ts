import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Stores email for OTP verification after registration
  private _pendingVerificationEmail: string = '';

  constructor(private http: HttpClient) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUserSubject.next(JSON.parse(userStr));
    }
    // Restore pending email from sessionStorage
    this._pendingVerificationEmail = sessionStorage.getItem('pendingVerificationEmail') || '';
  }

  login(credentials: any) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
        this.currentUserSubject.next(response);
      })
    );
  }

  register(data: any): Observable<any> {
    // Register does NOT return a token anymore — just a success message + email
    return this.http.post<any>(`${this.apiUrl}/register`, data).pipe(
      tap(response => {
        // Store email for OTP verification page — NO token stored
        if (response.email) {
          this._pendingVerificationEmail = response.email;
          sessionStorage.setItem('pendingVerificationEmail', response.email);
        }
      })
    );
  }

  verifyOtp(email: string, otpCode: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-otp`, { email, otpCode });
  }

  resendOtp(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send-otp`, { email });
  }

  get pendingVerificationEmail(): string {
    return this._pendingVerificationEmail;
  }

  clearPendingEmail() {
    this._pendingVerificationEmail = '';
    sessionStorage.removeItem('pendingVerificationEmail');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  get currentUser(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  get userRole(): string {
    const user = this.currentUser;
    return user?.role || '';
  }
}
