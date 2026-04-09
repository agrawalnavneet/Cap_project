import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  // Public endpoints that should NOT have a token attached
  const publicEndpoints = ['/auth/login', '/auth/register', '/auth/verify-otp', '/auth/send-otp'];
  const isPublicEndpoint = publicEndpoints.some(ep => req.url.includes(ep));
  if (token && !isPublicEndpoint) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(req);
};
