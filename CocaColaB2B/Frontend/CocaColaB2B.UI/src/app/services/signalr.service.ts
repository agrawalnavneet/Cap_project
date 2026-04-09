import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';

export interface OrderStatusUpdate {
  orderId: string;
  newStatus: string;
  driverName?: string;
  changedAt: string;
}

export interface NewOrderAlert {
  orderId: string;
  wholesalerName: string;
  totalAmount: number;
  orderDate: string;
}

export interface DeliveryAssignedAlert {
  orderId: string;
  wholesalerName: string;
  shippingAddress: string;
  orderTotal: number;
}

@Injectable({ providedIn: 'root' })
export class SignalRService implements OnDestroy {
  private hubConnection: signalR.HubConnection | null = null;
  private retryDelayMs = 1000;
  private maxRetryDelay = 30000;

  private orderStatusChanged$ = new Subject<OrderStatusUpdate>();
  private newOrderReceived$ = new Subject<NewOrderAlert>();
  private deliveryAssigned$ = new Subject<DeliveryAssignedAlert>();
  private connectionState$ = new Subject<string>();

  get orderStatusChanged(): Observable<OrderStatusUpdate> { return this.orderStatusChanged$.asObservable(); }
  get newOrderReceived(): Observable<NewOrderAlert> { return this.newOrderReceived$.asObservable(); }
  get deliveryAssigned(): Observable<DeliveryAssignedAlert> { return this.deliveryAssigned$.asObservable(); }
  get connectionState(): Observable<string> { return this.connectionState$.asObservable(); }

  startConnection(): void {
    if (this.hubConnection) return;

    const token = localStorage.getItem('token') || '';
    if (!token) {
      console.warn('SignalR: No auth token found, skipping connection.');
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/orders`, {
        // Always read the latest token — important after token refresh
        accessTokenFactory: () => localStorage.getItem('token') || ''
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Cap at 30s, exponential backoff
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), this.maxRetryDelay);
        }
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Register event handlers
    this.hubConnection.on('OrderStatusChanged', (data: OrderStatusUpdate) => {
      this.orderStatusChanged$.next(data);
    });

    this.hubConnection.on('NewOrderReceived', (data: NewOrderAlert) => {
      this.newOrderReceived$.next(data);
    });

    this.hubConnection.on('DeliveryAssigned', (data: DeliveryAssignedAlert) => {
      this.deliveryAssigned$.next(data);
    });

    this.hubConnection.onreconnecting(() => {
      this.connectionState$.next('reconnecting');
    });

    this.hubConnection.onreconnected(() => {
      this.connectionState$.next('connected');
    });

    this.hubConnection.onclose(() => {
      this.connectionState$.next('disconnected');
    });

    this.hubConnection.start()
      .then(() => {
        this.connectionState$.next('connected');
        console.log('SignalR connected');
      })
      .catch(err => {
        console.warn('SignalR connection failed, will retry:', err);
        this.connectionState$.next('disconnected');
      });
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
      this.connectionState$.next('disconnected');
    }
  }

  ngOnDestroy(): void {
    this.stopConnection();
    this.orderStatusChanged$.complete();
    this.newOrderReceived$.complete();
    this.deliveryAssigned$.complete();
    this.connectionState$.complete();
  }
}
