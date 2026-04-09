import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>Team Management</h2>
      <button class="btn-primary" (click)="showModal = true; resetForm()">
        <span class="material-symbols-outlined" style="font-size:18px">person_add</span> Add User
      </button>
    </div>

    <div *ngIf="errorMessage" class="error-banner">{{ errorMessage }}</div>
    <div *ngIf="successMessage" class="success-banner">{{ successMessage }}</div>

    <div class="table-container">
      <table class="premium-table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Details</th>
            <th>Contact</th><th>Created</th><th *ngIf="isAdmin">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of users">
            <td>
              <div class="user-cell">
                <div class="user-avatar">{{ user.fullName?.charAt(0)?.toUpperCase() || 'U' }}</div>
                <div>
                  <strong>{{ user.fullName }}</strong>
                  <div class="sub-text" *ngIf="user.enterpriseName">{{ user.enterpriseName }}</div>
                </div>
              </div>
            </td>
            <td class="text-muted">{{ user.email }}</td>
            <td><span class="role-tag" [attr.data-role]="user.role">{{ formatRole(user.role) }}</span></td>
            <td class="text-muted">
              <span *ngIf="user.role === 'Driver' && user.vehicleType">
                <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">directions_car</span>
                {{ user.vehicleType }}
              </span>
              <span *ngIf="user.role === 'Wholesaler'">
                <span class="credit-badge">{{ user.creditPoints || 0 }} pts</span>
              </span>
            </td>
            <td class="text-muted">{{ user.contactNumber || '-' }}</td>
            <td class="text-muted">{{ user.createdAt | date:'mediumDate' }}</td>
            <td class="actions" *ngIf="isAdmin">
              <button class="btn-icon" title="Edit" (click)="editUser(user)">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="btn-icon" title="Grant Credits" *ngIf="user.role === 'Wholesaler'"
                (click)="openCreditModal(user)">
                <span class="material-symbols-outlined">stars</span>
              </button>
              <button class="btn-icon delete" title="Delete" (click)="deleteUser(user.id)">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </td>
          </tr>
          <tr *ngIf="users.length === 0">
            <td colspan="7" class="empty-state">No users found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add / Edit User Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>{{ editingUser ? 'Edit User' : 'Add New User' }}</h3>

        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input [(ngModel)]="form.fullName" class="form-input" placeholder="Full name" />
        </div>
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input [(ngModel)]="form.email" type="email" class="form-input" placeholder="email@example.com" />
        </div>
        <div class="form-group" *ngIf="!editingUser">
          <label class="form-label">Password *</label>
          <input [(ngModel)]="form.password" type="password" class="form-input" placeholder="Min. 6 characters" />
        </div>
        <div class="form-group">
          <label class="form-label">Role *</label>
          <select [(ngModel)]="form.role" class="form-input" (change)="onRoleChange()">
            <option *ngFor="let role of allowedRoles" [value]="role.value">{{ role.label }}</option>
          </select>
        </div>

        <!-- Driver-specific: Vehicle Type -->
        <div class="form-group" *ngIf="form.role === 'Driver'">
          <label class="form-label">Vehicle Type *</label>
          <select [(ngModel)]="form.vehicleType" class="form-input">
            <option value="">-- Select Vehicle --</option>
            <option value="Bike">Bike</option>
            <option value="Auto">Auto</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Mini Truck">Mini Truck</option>
          </select>
          <span class="field-hint">Required for driver accounts</span>
        </div>

        <div class="form-group">
          <label class="form-label">Contact Number</label>
          <input [(ngModel)]="form.contactNumber" class="form-input" placeholder="+91 9876543210" />
        </div>
        <div class="form-group">
          <label class="form-label">Address</label>
          <input [(ngModel)]="form.address" class="form-input" placeholder="Address" />
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" (click)="showModal = false">Cancel</button>
          <button class="btn-primary" (click)="saveUser()">{{ editingUser ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>

    <!-- Grant Credit Points Modal -->
    <div class="modal-overlay" *ngIf="showCreditModal" (click)="showCreditModal = false">
      <div class="modal modal-sm" (click)="$event.stopPropagation()">
        <h3>Grant Credit Points</h3>
        <p class="modal-sub">Wholesaler: <strong>{{ creditTarget?.fullName }}</strong></p>
        <p class="modal-sub">Current balance: <strong>{{ creditTarget?.creditPoints || 0 }} pts</strong></p>
        <p class="modal-sub">Weekly purchased: <strong>{{ creditTarget?.weeklyUnitsPurchased || 0 }} units</strong></p>

        <div class="form-group" style="margin-top:16px">
          <label class="form-label">Points to Grant</label>
          <input [(ngModel)]="creditPointsToGrant" type="number" min="1" class="form-input" placeholder="e.g. 100" />
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" (click)="showCreditModal = false">Cancel</button>
          <button class="btn-primary" (click)="grantCredits()">Grant Points</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h2 { font-family: 'Manrope', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--on-surface); margin: 0; }
    .table-container { background: var(--surface-container-lowest); border-radius: 16px; box-shadow: var(--shadow-lg); overflow: hidden; }
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .user-avatar { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--primary), var(--primary-container)); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; flex-shrink: 0; }
    .sub-text { font-size: 0.72rem; color: var(--on-surface-variant); margin-top: 2px; }
    .text-muted { color: var(--on-surface-variant); }
    .role-tag { padding: 4px 12px; border-radius: 20px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .role-tag[data-role="Admin"] { background: rgba(79,70,229,0.08); color: var(--primary); }
    .role-tag[data-role="Wholesaler"] { background: rgba(0,69,152,0.08); color: var(--tertiary); }
    .role-tag[data-role="WarehouseManager"] { background: rgba(245,158,11,0.08); color: #b45309; }
    .role-tag[data-role="Driver"] { background: rgba(0,110,47,0.08); color: var(--secondary); }
    .credit-badge { background: rgba(187,0,22,0.08); color: var(--primary); padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: 700; }
    .actions { display: flex; gap: 8px; }
    .btn-icon { background: var(--surface-container-low); border: none; color: var(--on-surface-variant); width: 36px; height: 36px; border-radius: 10px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
    .btn-icon .material-symbols-outlined { font-size: 18px; }
    .btn-icon:hover { background: var(--surface-container-high); color: var(--primary); }
    .btn-icon.delete:hover { background: rgba(186,26,26,0.08); color: var(--error); }
    .empty-state { text-align: center; color: var(--outline); padding: 40px !important; }
    .modal-sm { max-width: 400px; }
    .modal-sub { font-size: 0.85rem; color: var(--on-surface-variant); margin: 4px 0; }
    .field-hint { font-size: 0.72rem; color: var(--outline); margin-top: 4px; display: block; }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  showModal = false;
  showCreditModal = false;
  editingUser: User | null = null;
  creditTarget: User | null = null;
  creditPointsToGrant = 0;
  form: any = {};
  errorMessage = '';
  successMessage = '';
  allowedRoles: { value: string; label: string }[] = [];

  get isAdmin(): boolean { return this.authService.userRole === 'Admin'; }

  constructor(private api: ApiService, private authService: AuthService) {}

  ngOnInit() { this.setAllowedRoles(); this.loadUsers(); }

  setAllowedRoles() {
    const role = this.authService.userRole;
    if (role === 'Admin') {
      this.allowedRoles = [
        { value: 'WarehouseManager', label: 'Warehouse Manager' },
        { value: 'Driver', label: 'Driver' }
      ];
    } else if (role === 'WarehouseManager') {
      this.allowedRoles = [{ value: 'Driver', label: 'Driver' }];
    }
  }

  loadUsers() {
    this.api.getUsers().subscribe({ next: (d) => this.users = d });
  }

  resetForm() {
    this.editingUser = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.form = { role: this.allowedRoles.length > 0 ? this.allowedRoles[0].value : 'Driver', vehicleType: '' };
  }

  onRoleChange() {
    if (this.form.role !== 'Driver') this.form.vehicleType = '';
  }

  formatRole(role: string): string {
    return role === 'WarehouseManager' ? 'Warehouse Manager' : role;
  }

  editUser(user: User) {
    this.editingUser = user;
    this.form = { ...user };
    this.errorMessage = '';
    this.successMessage = '';
    this.showModal = true;
  }

  saveUser() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.role === 'Driver' && !this.form.vehicleType) {
      this.errorMessage = 'Vehicle type is required for Driver accounts.';
      return;
    }

    if (this.editingUser) {
      this.api.updateUser(this.editingUser.id, this.form).subscribe({
        next: () => { this.showModal = false; this.successMessage = 'User updated!'; this.loadUsers(); },
        error: (err) => { this.errorMessage = err.error?.message || 'Failed to update.'; }
      });
    } else {
      this.api.createUser(this.form).subscribe({
        next: () => { this.showModal = false; this.successMessage = 'User created!'; this.loadUsers(); },
        error: (err) => { this.errorMessage = err.error?.message || 'Failed to create.'; }
      });
    }
  }

  deleteUser(id: string) {
    if (confirm('Delete this user?')) {
      this.api.deleteUser(id).subscribe({
        next: () => { this.successMessage = 'User deleted.'; this.loadUsers(); },
        error: (err) => { this.errorMessage = err.error?.message || 'Failed to delete.'; }
      });
    }
  }

  openCreditModal(user: User) {
    this.creditTarget = user;
    this.creditPointsToGrant = 0;
    this.showCreditModal = true;
  }

  grantCredits() {
    if (!this.creditTarget || this.creditPointsToGrant <= 0) {
      this.errorMessage = 'Enter a valid number of points.';
      return;
    }
    this.api.grantCreditPoints(this.creditTarget.id, this.creditPointsToGrant).subscribe({
      next: (res) => {
        this.showCreditModal = false;
        this.successMessage = res.message || 'Credit points granted!';
        this.loadUsers();
      },
      error: (err) => { this.errorMessage = err.error?.message || 'Failed to grant points.'; }
    });
  }
}
