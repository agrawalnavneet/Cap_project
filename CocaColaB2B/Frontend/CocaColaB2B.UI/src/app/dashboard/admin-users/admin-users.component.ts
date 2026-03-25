import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions">
      <h2>Manage Users</h2>
      <button class="btn-primary" (click)="showModal = true; resetForm()">+ Add User</button>
    </div>

    <div class="table-container glass-panel">
      <table class="premium-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Contact</th><th>Created</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of users">
            <td><strong>{{ user.fullName }}</strong></td>
            <td>{{ user.email }}</td>
            <td><span class="role-tag" [attr.data-role]="user.role">{{ user.role }}</span></td>
            <td>{{ user.contactNumber || '-' }}</td>
            <td>{{ user.createdAt | date:'mediumDate' }}</td>
            <td class="actions">
              <button class="btn-icon" (click)="editUser(user)">✎</button>
              <button class="btn-icon delete" (click)="deleteUser(user.id)">🗑</button>
            </td>
          </tr>
          <tr *ngIf="users.length === 0"><td colspan="6" class="empty-state">No users found</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
      <div class="modal glass-panel" (click)="$event.stopPropagation()">
        <h3>{{ editingUser ? 'Edit User' : 'Add New User' }}</h3>
        <div class="form-group"><label>Full Name</label><input [(ngModel)]="form.fullName" class="form-input" /></div>
        <div class="form-group"><label>Email</label><input [(ngModel)]="form.email" type="email" class="form-input" /></div>
        <div class="form-group" *ngIf="!editingUser"><label>Password</label><input [(ngModel)]="form.password" type="password" class="form-input" /></div>
        <div class="form-group">
          <label>Role</label>
          <select [(ngModel)]="form.role" class="form-input">
            <option value="Admin">Admin</option>
            <option value="Wholesaler">Wholesaler</option>
            <option value="WarehouseManager">Warehouse Manager</option>
            <option value="Driver">Driver</option>
          </select>
        </div>
        <div class="form-group"><label>Contact</label><input [(ngModel)]="form.contactNumber" class="form-input" /></div>
        <div class="form-group"><label>Address</label><input [(ngModel)]="form.address" class="form-input" /></div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="showModal = false">Cancel</button>
          <button class="btn-primary" (click)="saveUser()">{{ editingUser ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .table-container { padding: 0; overflow: hidden; border-radius: 16px; background: rgba(26,26,30,0.6); border: 1px solid rgba(255,255,255,0.05); }
    .premium-table { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table th { background: rgba(0,0,0,0.2); padding: 14px 20px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; }
    .premium-table td { padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    .role-tag { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; background: rgba(255,255,255,0.08); }
    .role-tag[data-role="Admin"] { background: rgba(244,0,9,0.15); color: var(--primary); }
    .role-tag[data-role="Wholesaler"] { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .role-tag[data-role="WarehouseManager"] { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .role-tag[data-role="Driver"] { background: rgba(16,185,129,0.15); color: #10b981; }
    .actions { display: flex; gap: 8px; }
    .btn-icon { background: rgba(255,255,255,0.08); border: none; color: white; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
    .btn-icon:hover { background: rgba(255,255,255,0.15); }
    .btn-icon.delete:hover { background: rgba(244,0,9,0.3); }
    .empty-state { text-align: center; color: rgba(255,255,255,0.3); padding: 40px !important; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { width: 480px; padding: 32px; border-radius: 16px; background: rgba(26,26,30,0.98); border: 1px solid rgba(255,255,255,0.08); }
    .modal h3 { margin-bottom: 24px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-size: 0.85rem; color: rgba(255,255,255,0.5); }
    .form-input { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; font-size: 0.9rem; }
    .form-input:focus { outline: none; border-color: var(--primary); }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .btn-primary { padding: 10px 24px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.2s; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-secondary { padding: 10px 24px; background: rgba(255,255,255,0.08); color: white; border: none; border-radius: 8px; cursor: pointer; }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  showModal = false;
  editingUser: User | null = null;
  form: any = {};

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() { this.api.getUsers().subscribe({ next: (d) => this.users = d }); }

  resetForm() { this.editingUser = null; this.form = { role: 'Wholesaler' }; }

  editUser(user: User) {
    this.editingUser = user;
    this.form = { ...user };
    this.showModal = true;
  }

  saveUser() {
    if (this.editingUser) {
      this.api.updateUser(this.editingUser.id, this.form).subscribe(() => { this.showModal = false; this.loadUsers(); });
    } else {
      this.api.createUser(this.form).subscribe(() => { this.showModal = false; this.loadUsers(); });
    }
  }

  deleteUser(id: string) {
    if (confirm('Delete this user?')) {
      this.api.deleteUser(id).subscribe(() => this.loadUsers());
    }
  }
}
