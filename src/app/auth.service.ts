import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, UserCredential, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, getDoc, DocumentData } from '@angular/fire/firestore';
import { authState } from 'rxfire/auth';
import { Observable, of, from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CustomizationService } from './customization.service';
import { AuthComponent } from './common/auth/auth.component';

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
    redirectUrl: string | null = null;  // Define the type of redirectUrl explicitly

    constructor(
        private auth: Auth,
        private firestore: Firestore,
        private dialog: MatDialog,
        private customizationService: CustomizationService,
        private router: Router
    ) {
        this.user$ = authState(this.auth);

        // Listen for authentication state changes
        this.user$.subscribe(user => {
            if (!user) {
                this.router.navigate(['/login']);
            }
        });
    }

    openAuthDialog(): void {
        this.dialog.open(AuthComponent);
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
                    const userDocRef = doc(this.firestore, `${this.customizationService.getSubdomainFromUrl}/users/${user.email}`);
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

    redirectToLogin(): void {
        this.router.navigate(['/login']);
    }

    handlePostLoginRedirect(): void {
        if (this.redirectUrl) {
            this.router.navigate([this.redirectUrl]);
            this.redirectUrl = null;  // Clear the stored URL
        } else {
            this.router.navigate(['/dashboard']);  // Default redirect if no URL is stored
        }
    }
}
