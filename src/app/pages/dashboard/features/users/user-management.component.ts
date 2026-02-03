import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagedUser, UserProfile, CustomRole } from '../../core/dashboard.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent {
  @Input('managedUsers') users: ManagedUser[] = [];
  @Input() currentUser!: UserProfile;
  @Input() availableRoles: CustomRole[] = [];

  @Output() deleteUser = new EventEmitter<number | string>();
  @Output() saveUser = new EventEmitter<any>(); 
  @Output() saveRole = new EventEmitter<any>(); 

  public isModalOpen: boolean = false;
  public isRoleCreatorMode: boolean = false;
  public isProcessing: boolean = false;
  public showToast: boolean = false;
  public toastMessage: string = '';

  public newUser = { name: '', email: '', password: '', role: 'User' };
  public newRoleName: string = '';
  public newRolePermissions = { 
    canViewDashboard: true, canViewOrders: false, canCreateOrder: false, 
    canManageInventory: false, canViewReports: false, canManageUsers: false, 
    canDeleteUsers: false, canViewCustomers: false, canManageSettings: false, canViewAuditLog: false 
  };

  openAddUserModal() {
    this.isRoleCreatorMode = false;
    this.newUser = { name: '', email: '', password: '', role: 'User' };
    this.isModalOpen = true;
  }

  openRoleModal() {
    this.isRoleCreatorMode = true;
    this.newRoleName = '';
    this.newRolePermissions = { canViewDashboard: true, canViewOrders: false, canCreateOrder: false, canManageInventory: false, canViewReports: false, canManageUsers: false, canDeleteUsers: false, canViewCustomers: false, canManageSettings: false, canViewAuditLog: false };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  handleCreateUser() {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.password) {
      alert("Please fill in all fields.");
      return;
    }
    this.isProcessing = true;
    this.saveUser.emit({ 
      data: this.newUser, 
      onSuccess: () => this.onSuccess(`User ${this.newUser.name} created successfully!`),
      onError: (err: string) => this.onError(err)
    });
  }

  handleCreateRole() {
    if (!this.newRoleName) {
      alert("Please enter a role name.");
      return;
    }
    this.isProcessing = true;
    this.saveRole.emit({
      data: { name: this.newRoleName, permissions: this.newRolePermissions },
      onSuccess: () => this.onSuccess(`Role "${this.newRoleName}" saved successfully!`),
      onError: (err: string) => this.onError(err)
    });
  }

  onSuccess(msg: string) {
    this.isProcessing = false;
    this.isModalOpen = false;
    this.toastMessage = msg;
    this.showToast = true;
  }

  onError(err: string) {
    this.isProcessing = false;
    alert(err);
  }
}