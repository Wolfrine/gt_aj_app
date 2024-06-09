import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, UserCredential, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, collection, addDoc, doc, setDoc, getDoc, DocumentData } from '@angular/fire/firestore';
import { authState } from 'rxfire/auth';
import { Observable, of, from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

interface UserRole extends DocumentData {
    role: string;
    name?: string;
    age?: number;
    email?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    user$: Observable<FirebaseUser | null>;

    constructor(private auth: Auth, private firestore: Firestore) {
        this.user$ = authState(this.auth);
    }

    googleSignIn(): Promise<UserCredential> {
        return signInWithPopup(this.auth, new GoogleAuthProvider());
    }

    signOut() {
        return signOut(this.auth);
    }

    getUserRole(): Observable<string> {
        return authState(this.auth).pipe(
            switchMap(user => {
                if (user) {
                    const userDocRef = doc(this.firestore, `users/${user.email}`);
                    return from(getDoc(userDocRef)).pipe(
                        map(docSnap => {
                            if (docSnap.exists()) {
                                const userData = docSnap.data() as UserRole;
                                return userData.role;
                            } else {
                                return 'user';
                            }
                        })
                    );
                } else {
                    return of('user');
                }
            })
        );
    }
}
