import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase'; // Verify this path matches your folder structure
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,          // for *ngIf
    ReactiveFormsModule    // for formGroup
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup; 
  showPassword = false;
  loginError = '';
  isLoading = false; 

  constructor(
    private fb: FormBuilder,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false], // Default to false
    });
  }

  // Helper for HTML access
  get f() { return this.loginForm.controls; }

  ngOnInit() {
    // 🔍 CHECK LOCAL STORAGE FOR SAVED CREDENTIALS
    if (isPlatformBrowser(this.platformId)) {
      const savedCreds = localStorage.getItem('rememberCreds');
      
      if (savedCreds) {
        const { email, password } = JSON.parse(savedCreds);
        
        // Auto-fill the form and set the checkbox to true
        this.loginForm.patchValue({
          email: email,
          password: password,
          rememberMe: true
        });
      }
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async submit() {
    // 1. Check Form Validity
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.loginError = '';

    const { email, password, rememberMe } = this.loginForm.value;

    try {
      // 2. Firebase Login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (isPlatformBrowser(this.platformId)) {
        
        // --- NEW: GENERATE A DISPLAY NAME IF ONE DOESN'T EXIST ---
        let displayName = user.displayName;
        if (!displayName && user.email) {
            // Fallback: Use the part before '@' in the email
            const namePart = user.email.split('@')[0];
            // Capitalize first letter (e.g. "geet" -> "Geet")
            displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        }

        // --- NEW: PREPARE PROFILE FOR DASHBOARD ---
        const userProfile = {
            name: displayName || 'User', // The name we just calculated
            role: 'Store Admin',         // You can customize this role if needed
            email: user.email
        };

        // A. Store Profile for Dashboard (KEY STEP)
        localStorage.setItem('user_profile', JSON.stringify(userProfile));

        // B. Store Active Session (Standard Auth check)
        localStorage.setItem('authUser', JSON.stringify({ 
            uid: user.uid, 
            email: user.email 
        }));

        // C. Handle "Remember Me" Logic
        if (rememberMe) {
          localStorage.setItem('rememberCreds', JSON.stringify({ email, password }));
        } else {
          localStorage.removeItem('rememberCreds');
        }
      }

      // 3. Navigate to Dashboard
      this.router.navigate(['/dashboard']);

    } catch (error: any) {
      console.error('Login Error:', error);
      
      // Handle Firebase specific error codes for better UX
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
         this.loginError = 'Incorrect email or password.';
      } else if (error.code === 'auth/too-many-requests') {
         this.loginError = 'Access disabled temporarily due to many failed attempts.';
      } else {
         this.loginError = 'Login failed. Please check your internet connection.';
      }
      
      alert(this.loginError); 

    } finally {
      this.isLoading = false;
    }
  }
}