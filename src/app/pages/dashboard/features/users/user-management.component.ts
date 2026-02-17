import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
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

  // 🔥 Inject ChangeDetectorRef to force UI updates when callbacks run
  constructor(private cdr: ChangeDetectorRef) {}

  openAddUserModal() {
    this.isRoleCreatorMode = false;
    this.newUser = { name: '', email: '', password: '', role: 'User' };
    this.isModalOpen = true;
  }

  openRoleModal() {
    this.isRoleCreatorMode = true;
    this.newRoleName = '';
    // Reset permissions
    this.newRolePermissions = { canViewDashboard: true, canViewOrders: false, canCreateOrder: false, canManageInventory: false, canViewReports: false, canManageUsers: false, canDeleteUsers: false, canViewCustomers: false, canManageSettings: false, canViewAuditLog: false };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isProcessing = false;
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
    if (!this.newRoleName.trim()) {
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

  // 🔥 FIXED: Force UI update and close modal immediately
  onSuccess(msg: string) {
    this.isProcessing = false;
    this.isModalOpen = false;      // Close modal
    this.isRoleCreatorMode = false; // Reset mode
    this.toastMessage = msg;
    this.showToast = true;

    this.cdr.detectChanges(); // ⚡ Force Angular to detect these changes immediately

    // Auto-hide toast
    setTimeout(() => {
        this.showToast = false;
        this.cdr.detectChanges();
    }, 3000);
  }

  onError(err: string) {
    this.isProcessing = false;
    this.cdr.detectChanges(); // ⚡ Force update to hide 'Processing...' state
    alert(err);
  }
}