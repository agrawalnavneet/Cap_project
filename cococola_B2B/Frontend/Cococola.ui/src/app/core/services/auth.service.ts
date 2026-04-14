import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { DecodedToken, LoginResponse, RegisterDealerDto, UserRole } from '../models/user.model';
import { API_ENDPOINTS } from '../../shared/constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Access token is intentionally in-memory only for stronger XSS posture.
  private accessToken: string | null = null;

  // Signals for state management (Successor to NgRx Store)
  private _user = signal<DecodedToken | null>(null);
  private _loading = signal<boolean>(false);

  // Expose signals as computed or read-only
  currentUser = computed(() => this._user());
  userRole = computed(() => (this._user()?.role as UserRole) ?? null);
  isLoggedIn = computed(() => !!this._user());
  isLoading = computed(() => this._loading());

  constructor(private http: HttpClient, private router: Router) {
    // Basic recovery if token exists (e.g. from a refresh session)
    // In a real app, we might check sessionStorage or do a silent refresh here.
  }

  login(email: string, password: string): Observable<LoginResponse> {
    this._loading.set(true);
    return this.http
      .post<LoginResponse>(API_ENDPOINTS.auth.login(), { email, password }, { withCredentials: true })
      .pipe(
        map(response => this.normalizeAuthResponse(response)),
        tap(response => {
          if (response.accessToken) {
            this.storeToken(response);
          }
        }),
        catchError(err => {
          this._loading.set(false);
          throw err;
        }),
        tap(() => this._loading.set(false))
      );
  }

  verifyLoginOtp(email: string, otp: string): Observable<LoginResponse> {
    this._loading.set(true);
    return this.http
      .post<LoginResponse>(API_ENDPOINTS.auth.loginVerifyOtp(), { email, otp }, { withCredentials: true })
      .pipe(
        map(response => this.normalizeAuthResponse(response)),
        tap(response => {
          if (response.accessToken) {
            this.storeToken(response);
          }
        }),
        catchError(err => {
          this._loading.set(false);
          throw err;
        }),
        tap(() => this._loading.set(false))
      );
  }

  register(dto: RegisterDealerDto): Observable<{ userId: string; message: string }> {
    return this.http.post<{ userId: string; message: string }>(API_ENDPOINTS.auth.register(), dto);
  }

  verifyRegistrationOtp(email: string, otp: string): Observable<void> {
    return this.http.post<void>(API_ENDPOINTS.auth.registerVerifyOtp(), { email, otp });
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(API_ENDPOINTS.auth.forgotPassword(), { email });
  }

  resetPassword(email: string, otp: string, newPassword: string): Observable<void> {
    return this.http.post<void>(API_ENDPOINTS.auth.forgotPasswordReset(), { email, otp, newPassword });
  }

  refreshToken(): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(API_ENDPOINTS.auth.refresh(), {}, { withCredentials: true })
      .pipe(
        map(response => this.normalizeAuthResponse(response)),
        tap(response => {
          if (response.accessToken) {
            this.storeToken(response);
          }
        })
      );
  }

  logout(): void {
    this.http.post(API_ENDPOINTS.auth.logout(), {}, { withCredentials: true }).subscribe({
      next: () => { },
      error: () => { }
    });

    this.accessToken = null;
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getDecodedToken(): DecodedToken | null {
    return this._user();
  }

  getUserRole(): UserRole | null {
    return this.userRole();
  }

  getUserName(): string | null {
    return this._user()?.fullName ?? null;
  }

  isAuthenticated(): boolean {
    const user = this._user();
    if (!user) return false;
    return user.exp * 1000 > Date.now();
  }

  getDealerId(): string | null {
    return this._user()?.dealerId || null;
  }

  getRoleDashboardRoute(): string {
    const role = this.getUserRole();
    switch (role) {
      case UserRole.Dealer:
        return '/dealer/dashboard';
      case UserRole.Admin:
        return '/admin/dashboard';
      case UserRole.SuperAdmin:
        return '/super-admin/dashboard';
      case UserRole.DeliveryAgent:
        return '/agent/deliveries';
      default:
        return '/auth/login';
    }
  }

  private storeToken(response: LoginResponse): void {
    this.accessToken = response.accessToken;
    const decoded = this.decodeToken(response.accessToken);
    this._user.set(decoded);
  }

  ensureAuthenticated(): Observable<boolean> {
    if (this.isAuthenticated()) {
      return of(true);
    }

    return this.refreshToken().pipe(
      map(response => !!response.accessToken && this.isAuthenticated()),
      catchError(() => {
        this._user.set(null);
        return of(false);
      })
    );
  }

  private normalizeAuthResponse(response: unknown): LoginResponse {
    const payload = ((response as any)?.data ?? response) as any;

    return {
      accessToken: payload?.accessToken ?? payload?.AccessToken ?? '',
      expiresInSeconds: payload?.expiresInSeconds ?? payload?.ExpiresInSeconds ?? 0,
      refreshToken: payload?.refreshToken ?? payload?.RefreshToken ?? null,
      role: payload?.role ?? payload?.Role ?? '',
      fullName: payload?.fullName ?? payload?.FullName ?? '',
      userId: payload?.userId ?? payload?.UserId ?? '',
    };
  }

  private decodeToken(token: string): DecodedToken | null {
    try {
      const payload = token.split('.')[1];
      const normalizedPayload = payload
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(payload.length + ((4 - payload.length % 4) % 4), '=');
      const decoded = JSON.parse(atob(normalizedPayload));
      const rawRole = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      let primaryRole = rawRole;
      if (Array.isArray(rawRole)) {
        if (rawRole.includes('SuperAdmin')) primaryRole = 'SuperAdmin';
        else if (rawRole.includes('Admin')) primaryRole = 'Admin';
        else primaryRole = rawRole[0];
      }

      return {
        sub: decoded.sub || decoded.nameid,
        email: decoded.email,
        role: primaryRole,
        fullName: decoded.fullName || decoded.unique_name,
        dealerId: decoded.dealerId,
        jti: decoded.jti,
        exp: decoded.exp,
        businessName: decoded.businessName,
        gstNumber: decoded.gstNumber,
        phoneNumber: decoded.phoneNumber,
        addressLine1: decoded.addressLine1,
        city: decoded.city,
        state: decoded.state,
        pinCode: decoded.pinCode,
        profilePictureUrl: decoded.profilePictureUrl
      };
    } catch {
      return null;
    }
  }
}

