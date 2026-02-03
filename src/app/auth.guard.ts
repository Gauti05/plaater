import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // 1. CHECK: Are we in a Browser?
  if (isPlatformBrowser(platformId)) {
    
    const userStr = localStorage.getItem('user_profile');
    
    if (!userStr) {
      router.navigate(['/login']);
      return false;
    }

    const user = JSON.parse(userStr);

    // 2. CHECK: Is "Junior Staff" trying to access the "Users" URL?
    if (state.url.includes('users')) {
      if (user.permissions.canManageUsers) {
        return true; 
      } else {
        // --- FIX: Wrap alert in setTimeout to ensure it shows up ---
        setTimeout(() => {
          alert('⛔ ACCESS DENIED: You do not have permission to view this page.');
        }, 100);
        
        router.navigate(['/dashboard']); 
        return false;
      }
    }

    return true; 
  }

  // Server-side default
  return true; 
};