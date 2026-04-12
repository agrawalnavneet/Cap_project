import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { LogisticsDashboardComponent } from './pages/dashboard/logistics-dashboard.component';
import { PendingDispatchComponent } from './pages/pending-dispatch/pending-dispatch.component';
import { DispatchQueueComponent } from './pages/dispatch-queue/dispatch-queue.component';
import { LiveTrackingComponent } from './pages/live-tracking/live-tracking.component';
import { AgentsManagementComponent } from './pages/agents/agents-management.component';
import { VehiclesManagementComponent } from './pages/vehicles/vehicles-management.component';
import { SlaMonitorComponent } from './pages/sla-monitor/sla-monitor.component';
import { FormsModule } from '@angular/forms';

const PAGES = [
  LogisticsDashboardComponent,
  PendingDispatchComponent,
  DispatchQueueComponent,
  LiveTrackingComponent,
  AgentsManagementComponent,
  VehiclesManagementComponent,
  SlaMonitorComponent
];

@NgModule({
  declarations: [...PAGES],
  imports: [SharedModule, FormsModule],
  exports: [...PAGES]
})
export class LogisticsPagesModule { }
