import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './auth.guard'; // <--- Import the Guard

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard] // <--- Protects Dashboard
  },
  
  // This route exists ONLY to test your "Junior Staff" restriction
  { 
    path: 'users', 
    component: DashboardComponent, 
    canActivate: [authGuard] // <--- Blocks Junior Staff here
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
];