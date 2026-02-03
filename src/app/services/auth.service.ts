import { Injectable } from '@angular/core';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  async signup(name: string, email: string, password: string) {
    // 1️⃣ Create user in Firebase Auth
    const userCredential =
      await createUserWithEmailAndPassword(auth, email, password);

    const user = userCredential.user;

    // 2️⃣ Save user data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      createdAt: new Date()
    });

    return user;
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }
}
