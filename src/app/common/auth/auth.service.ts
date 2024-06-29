import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, UserCredential, User as FirebaseUser, user, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, DocumentData } from '@angular/fire/firestore';
import { authState } from 'rxfire/auth';
import { Observable, of, from, BehaviorSubject } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CustomizationService } from '../../customization.service';
import { AuthComponent } from './auth.component';

interface UserRole extends DocumentData {
    role: string;
    name?: string;
    age?: number;
    email?: string;
    status: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    user$: Observable<FirebaseUser | null>;
    private loginNotificationShown = new BehaviorSubject<boolean>(false);
    redirectUrl: string | null = null;

    constructor(
        private auth: Auth,
        private firestore: Firestore,
        private dialog: MatDialog,
        private customizationService: CustomizationService,
        private router: Router
    ) {
        this.user$ = authState(this.auth);
    }

    getCurrentUser(): Observable<User | null> {
        return authState(this.auth);
    }

    openAuthDialog(): void {
        this.dialog.open(AuthComponent);
    }

    googleSignIn(): Promise<UserCredential> {
        return signInWithPopup(this.auth, new GoogleAuthProvider());
    }

    signOut() {
        this.loginNotificationShown.next(false);  // Reset the notification flag on sign out
        this.router.navigate(['/login']);
        return signOut(this.auth);
    }

    getUserRole(): Observable<string> {
        return this.getCurrentUser().pipe(
            switchMap(user => {
                if (user) {
                    const userDocRef = doc(this.firestore, `institutes/${this.customizationService.getSubdomainFromUrl()}/users/${user.email}`);
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

    isAuthenticated(): Observable<boolean> {
        return user(this.auth).pipe(
            map(currentUser => !!currentUser)
        );
    }

    redirectToLogin(): void {
        this.router.navigate(['/login']);
    }

    redirectToHome(): void {
        this.router.navigate(['/home']);
    }

    handlePostLoginRedirect(): void {
        if (this.redirectUrl) {
            this.router.navigate([this.redirectUrl]);
        } else {
            this.router.navigate(['/dashboard']);
        }
    }

    getLoginNotificationShown(): Observable<boolean> {
        return this.loginNotificationShown.asObservable();
    }

    setLoginNotificationShown(value: boolean): void {
        this.loginNotificationShown.next(value);
    }
}
