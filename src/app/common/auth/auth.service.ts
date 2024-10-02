import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, UserCredential, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, getDoc, DocumentData, collection, query, where, collectionData } from '@angular/fire/firestore';
import { authState } from 'rxfire/auth';
import { Observable, of, from, BehaviorSubject } from 'rxjs';
import { switchMap, map, take } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CustomizationService } from '../../customization.service';
import { AuthComponent } from './auth.component';
import { NgZone } from '@angular/core'; // Import NgZone

export interface UserRole extends DocumentData {
    role: string;
    name?: string;
    age?: number;
    email?: string;
    status: string;
}

export interface UserWithRole extends FirebaseUser {
    role: string;
    adminMessage?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    user$: Observable<UserWithRole | null>;
    private userSubject = new BehaviorSubject<UserWithRole | null>(null);
    private loginNotificationShown = new BehaviorSubject<boolean>(false);
    redirectUrl: string | null = null;

    constructor(
        private auth: Auth,
        private firestore: Firestore,
        private dialog: MatDialog,
        private customizationService: CustomizationService,
        private router: Router,
        private ngZone: NgZone
    ) {
        this.user$ = this.userSubject.asObservable();

        // Fetch user once on initialization
        authState(this.auth).pipe(
            switchMap(user => {
                if (user) {
                    const userDocRef = doc(this.firestore, `institutes/${this.customizationService.getSubdomainFromUrl()}/users/${user.email}`);
                    return from(getDoc(userDocRef)).pipe(
                        map(docSnap => {
                            if (docSnap.exists()) {
                                const userData = docSnap.data() as UserRole;
                                const userWithRole: UserWithRole = { ...user, role: userData.role, adminMessage: userData['adminMessage'] || null }; // Fetch adminMessage
                                this.userSubject.next(userWithRole);
                                return userWithRole;
                            } else {
                                const userWithRole: UserWithRole = { ...user, role: 'user' };
                                this.userSubject.next(userWithRole);
                                return userWithRole;
                            }
                        })
                    );
                } else {
                    this.userSubject.next(null);
                    return of(null);
                }
            })
        ).subscribe();
    }

    getCurrentUser(): Observable<UserWithRole | null> {
        return this.user$;
    }

    getUserRole(): Observable<string | null> {
        return this.user$.pipe(
            map(user => user?.role || 'user')
        );
    }

    isAuthenticated(): Observable<boolean> {
        return this.user$.pipe(
            map(currentUser => !!currentUser)
        );
    }

    openAuthDialog(): void {
        this.dialog.open(AuthComponent);
    }

    googleSignIn(): Promise<UserCredential> {
        return signInWithPopup(this.auth, new GoogleAuthProvider()).then(result => {
            this.ngZone.run(() => {
                // Close the login dialog inside Angular's zone
                this.dialog.closeAll();

                // Wait briefly to ensure user data is loaded before redirection
                setTimeout(() => {
                    this.handlePostLoginRedirect(); // Redirect after login
                }, 500); // Delay to allow any asynchronous operations to complete

            });
            return result; // Return the UserCredential as expected
        }).catch(error => {
            console.error("Login failed:", error);
            throw error; // Rethrow the error to maintain the return type of the function
        });
    }


    signOut() {
        this.userSubject.next(null);  // Clear cached role on sign out
        this.loginNotificationShown.next(false);  // Reset the notification flag on sign out
        this.router.navigate(['/login']);
        return signOut(this.auth);
    }

    redirectToLogin(): void {
        this.router.navigate(['/login']);
    }

    redirectToHome(): void {
        this.router.navigate(['/home']);
    }

    handlePostLoginRedirect(): void {
        if (this.redirectUrl) {
            this.ngZone.run(() => {
                console.log(`Redirecting to stored URL: ${this.redirectUrl}`);
                this.router.navigate([this.redirectUrl]);  // Navigate to the previously stored URL
                this.redirectUrl = null;  // Reset after navigating
            });
        } else {
            this.ngZone.run(() => {
                console.log('Redirecting to dashboard');
                this.router.navigate(['/dashboard']);  // Default to dashboard
            });
        }
    }

    getLoginNotificationShown(): Observable<boolean> {
        return this.loginNotificationShown.asObservable();
    }

    setLoginNotificationShown(value: boolean): void {
        this.loginNotificationShown.next(value);
    }

    getStudents(subdomain: string): Observable<any[]> {
        const usersCollection = collection(this.firestore, `institutes/${subdomain}/users`);
        const studentsQuery = query(usersCollection, where('role', '==', 'student'));

        return collectionData(studentsQuery);
    }
}
