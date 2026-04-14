import { NgModule, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// Core
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { SharedModule } from './shared/shared.module';

// Interceptors
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { ResponseEnvelopeInterceptor } from './core/interceptors/response-envelope.interceptor';
import { ZoneInterceptor } from './core/interceptors/zone.interceptor';

import { environment } from '../environments/environment';

// Pages
import { UnauthorizedPageComponent } from './features/unauthorized/unauthorized-page.component';

@NgModule({
  declarations: [
    App,
    UnauthorizedPageComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    SharedModule,
  ],
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    { provide: HTTP_INTERCEPTORS, useClass: ZoneInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ResponseEnvelopeInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [App]
})
export class AppModule { }
