// import { Component, Input, Output, EventEmitter } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { UserProfile } from '../../core/dashboard.model';

// @Component({
//   selector: 'app-sidebar',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './sidebar.component.html',
//   styleUrls: ['./sidebar.component.css']
// })
// export class SidebarComponent {
//   @Input() currentUser!: UserProfile;
//   @Input() currentView!: string;
//   @Output() navigate = new EventEmitter<string>();
//   @Output() logout = new EventEmitter<void>();
//   @Output() launchPos = new EventEmitter<void>();
//   @Output() closeSidebar = new EventEmitter<void>();
// }



import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../../core/dashboard.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  // 🔥 FIX: Allow 'null' so Angular stops complaining about the '?' in your HTML
  @Input() currentUser: UserProfile | null = null; 
  
  @Input() currentView: string = 'Dashboard';

  @Output() navigate = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();
  @Output() launchPos = new EventEmitter<void>();
  @Output() closeSidebar = new EventEmitter<void>();
}