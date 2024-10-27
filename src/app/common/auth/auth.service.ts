import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, UserCredential, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, getDoc, DocumentData, collection, query, where, collectionData, setDoc } from '@angular/fire/firestore';
import { authState } from 'rxfire/auth';
import { Observable, of, from, BehaviorSubject } from 'rxjs';
import { switchMap, map, take, tap } from 'rxjs/operators'; // Added `tap` to cache results
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CustomizationService } from '../../customization.service';
import { AuthComponent } from './auth.component';
import { NgZone } from '@angular/core'; // Import NgZone
import { Logger } from '../../logger.service';  // Import Logger service
import { MessagingService } from '../../messaging.service';

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

    // Added caching for user data
    private currentUserData: UserWithRole | null = null; // Cache for current user data
    private authState$ = authState(this.auth).pipe(take(1));  // Cached authState observable

    redirectUrl: string | null = null;

    constructor(
        private auth: Auth,
        private firestore: Firestore,
        private dialog: MatDialog,
        private customizationService: CustomizationService,
        private router: Router,
        private ngZone: NgZone,
        private logger: Logger,  // Inject Logger service
        private messagingService: MessagingService
    ) {
        this.user$ = this.userSubject.asObservable();
        // Fetch user once on initialization
        this.getAuthState().subscribe(); // Subscribe to getAuthState to fetch user data once

        this.authState$.subscribe((user) => {
            console.log('Auth State User:', user);
        });
    }



    // This method caches the result of authState and reuses it across the application
    getAuthState(): Observable<UserWithRole | null> {
        if (this.currentUserData) {
            return of(this.currentUserData);  // Return cached user data if available
        }
        return this.authState$.pipe(
            switchMap(user => {
                if (user && !this.currentUserData) {
                    const userDocRef = doc(this.firestore, `institutes/${this.customizationService.getSubdomainFromUrl()}/users/${user.email}`);
                    return from(this.logger.logAndGet(userDocRef, 'AuthService', `institutes/${this.customizationService.getSubdomainFromUrl()}/users`, 'authState')).pipe(
                        map(docSnap => {
                            if (docSnap.exists()) {
                                const userData = docSnap.data() as UserRole;
                                this.currentUserData = { ...user, role: userData.role, adminMessage: userData['adminMessage'] || null };
                                this.userSubject.next(this.currentUserData);
                                this.saveFCMToken(user);
                                return this.currentUserData;
                            } else {
                                const userWithRole: UserWithRole = { ...user, role: 'user' };
                                this.currentUserData = userWithRole;
                                this.userSubject.next(this.currentUserData);
                                this.saveFCMToken(user);
                                return userWithRole;
                            }
                        })
                    );
                } else {
                    this.userSubject.next(this.currentUserData);
                    return of(this.currentUserData);
                }
            }),
            tap(user => {
                this.currentUserData = user; // Cache the user data
            })
        );
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
                const userEmail = result.user.email;
                if (userEmail) {
                    const userDocRef = doc(this.firestore, `institutes/${this.customizationService.getSubdomainFromUrl()}/users/${userEmail}`);
                    getDoc(userDocRef).then((docSnap) => {
                        if (docSnap.exists()) {
                            const userData = docSnap.data() as UserRole;

                            // Check if the user has 'accepted' status and a valid role
                            if (userData.status === 'accepted' && userData.role) {
                                console.log('User is accepted and has a valid role. Redirecting to dashboard.');

                                // Close all dialogs and navigate to dashboard
                                this.dialog.closeAll();
                                this.router.navigate(['/dashboard']).then(() => {
                                    console.log('Redirected to dashboard');

                                    // Check if the URL is still '/login' after the redirection
                                    if (this.router.url === '/login') {
                                        console.warn('Still on /login after redirection, reloading page');
                                        window.location.reload();  // Force reload if still on /login
                                    }
                                });
                            } else {
                                console.warn('User is not accepted or has no valid role.');
                            }
                        } else {
                            console.warn('User document does not exist in Firestore.');
                        }
                    }).catch(error => {
                        console.error('Error fetching user document from Firestore:', error);
                    });
                }
            });

            return result; // Return the UserCredential as expected
        }).catch(error => {
            console.error("Login failed:", error);
            throw error; // Rethrow the error to maintain the return type of the function
        });
    }




    signOut() {
        this.userSubject.next(null);  // Clear cached role on sign out
        this.currentUserData = null;  // Clear cached user data
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

        // Log Firestore Query Operation
        this.logger.addLog({
            type: 'READ',
            module: 'AuthService',
            method: 'getStudents',
            collection: `institutes/${subdomain}/users`,
            dataSize: 0,  // Adjust this if you want to calculate the actual size of data fetched
            timestamp: new Date().toISOString(),
        });

        return collectionData(studentsQuery);
    }

    saveFCMToken(user: FirebaseUser) {
        console.log('FCM token save called');
        this.messagingService.getToken().then((token) => {
            if (token) {
                const userRef = doc(this.firestore, `institutes/${this.customizationService.getSubdomainFromUrl()}/users/${user.email}`);
                getDoc(userRef).then((docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        let tokens = userData['fcmTokens'] || [];  // Retrieve the existing token array or initialize
                        if (!tokens.includes(token)) {  // Add the token if it doesn't already exist
                            tokens.push(token);
                            setDoc(userRef, { fcmTokens: tokens }, { merge: true })
                                .then(() => {
                                    console.log('FCM Token added successfully.');
                                })
                                .catch((error) => {
                                    console.error('Error saving FCM token: ', error);
                                });
                        } else {
                            console.log('Token already exists.');
                        }
                    } else {
                        // User document doesn't exist yet, create it with the token array
                        setDoc(userRef, { fcmTokens: [token] }, { merge: true })
                            .then(() => {
                                console.log('FCM Token saved successfully in new user document.');
                            })
                            .catch((error) => {
                                console.error('Error creating user document with FCM token: ', error);
                            });
                    }
                }).catch((error) => {
                    console.error('Error fetching user document: ', error);
                });
            } else {
                console.log('No FCM token received.');
            }
        }).catch((error) => {
            console.error('Error fetching FCM token:', error);
        });
    }
}
