import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Search, RotateCcw, Heart, ShoppingCart, PackageSearch, Menu, Home, Package, ShoppingBag, Receipt, Bell, User, LogOut, Minus, Plus, Trash2, X, CreditCard, ArrowRight, MapPin, LayoutDashboard, UserPlus, Users, Truck, CheckSquare, Settings } from 'lucide-angular';

// Phase 1 Components
import { CcbButtonComponent } from './ui/button/ccb2b-button.component';
import { CcbInputComponent } from './ui/input/ccb2b-input.component';
import { CcbCardComponent } from './ui/card/ccb2b-card.component';
import { CcbBadgeComponent } from './ui/badge/ccb2b-badge.component';
import { CcbStatusBadgeComponent } from './ui/status-badge/ccb2b-status-badge.component';
import { CcbTableComponent } from './ui/table/ccb2b-table.component';
import { CcbModalComponent } from './ui/modal/ccb2b-modal.component';
import { CcbSkeletonComponent } from './ui/skeleton/ccb2b-skeleton.component';
import { CcbEmptyStateComponent } from './ui/empty-state/ccb2b-empty-state.component';
import { CcbPageHeaderComponent } from './ui/page-header/ccb2b-page-header.component';
import { CcbSidebarComponent } from './ui/sidebar/ccb2b-sidebar.component';
import { ToastContainerComponent } from './ui/toast/toast-container.component';

// Phase 2 Components
import { CcbStatCardComponent } from './ui/stat-card/ccb2b-stat-card.component';
import { CcbDataTableComponent } from './ui/data-table/ccb2b-data-table.component';
import { CcbTabsComponent } from './ui/tabs/ccb2b-tabs.component';
import { CcbConfirmDialogComponent } from './ui/confirm-dialog/ccb2b-confirm-dialog.component';
import { CcbChipInputComponent } from './ui/chip-input/ccb2b-chip-input.component';
import { CcbTimelineComponent } from './ui/timeline/ccb2b-timeline.component';
import { CcbAvatarComponent } from './ui/avatar/ccb2b-avatar.component';
import { CcbSearchInputComponent } from './ui/search-input/ccb2b-search-input.component';

// Pipes
import { InrCurrencyPipe } from './pipes/inr-currency.pipe';
import { RelativeTimePipe } from './pipes/relative-time.pipe';
import { NotificationBellComponent } from './ui/notification-bell/notification-bell.component';

const COMPONENTS = [
  // Phase 1
  CcbButtonComponent,
  CcbInputComponent,
  CcbCardComponent,
  CcbBadgeComponent,
  CcbStatusBadgeComponent,
  CcbTableComponent,
  CcbModalComponent,
  CcbSkeletonComponent,
  CcbEmptyStateComponent,
  CcbPageHeaderComponent,
  CcbSidebarComponent,
  ToastContainerComponent,
  // Phase 2
  CcbStatCardComponent,
  CcbDataTableComponent,
  CcbTabsComponent,
  CcbConfirmDialogComponent,
  CcbChipInputComponent,
  CcbTimelineComponent,
  CcbAvatarComponent,
  CcbSearchInputComponent,
  NotificationBellComponent,
];

const PIPES = [InrCurrencyPipe, RelativeTimePipe];

@NgModule({
  declarations: [...COMPONENTS, ...PIPES],
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    RouterModule,
    LucideAngularModule.pick({ 
      Search, RotateCcw, Heart, ShoppingCart, PackageSearch, 
      Menu, Home, Package, ShoppingBag, Receipt, Bell, User, LogOut,
      Minus, Plus, Trash2, X, CreditCard, ArrowRight, MapPin,
      LayoutDashboard, UserPlus, Users, Truck, CheckSquare, Settings
    })
  ],
  exports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    RouterModule, 
    LucideAngularModule,
    ...COMPONENTS, 
    ...PIPES
  ],
})
export class SharedModule {}
