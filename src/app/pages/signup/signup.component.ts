import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-signup',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {

  signupForm;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.signupForm = this.fb.group({
      name: ['', Validators.required],   // ✅ THIS WAS MISSING
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

 submit() {
  if (this.signupForm.valid) {
    const { name, email, password } = this.signupForm.value;

    this.authService.signup(name!, email!, password!)
      .then(() => {
        alert('Signup successful & data saved to DB');
      })
      .catch(err => alert(err.message));
  }
}

}

