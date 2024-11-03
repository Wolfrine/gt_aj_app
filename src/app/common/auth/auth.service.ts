import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, UserCredential, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, getDoc, DocumentData, collection, query, where, collectionData, setDoc } from '@angular/fire/firestore';
import { authState } from 'rxfire/auth';
import { Observable, of, from, BehaviorSubject } from 'rxjs';
import { switchMap, map, take, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CustomizationService } from '../../customization.service';
import { AuthComponent } from './auth.component';
import { NgZone } from '@angular/core';
import { Logger } from '../../logger.service';
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

    private currentUserData: UserWithRole | null = null;
    private authState$ = authState(this.auth).pipe(take(1));

    redirectUrl: string | null = null;

    constructor(
        private auth: Auth,
        private firestore: Firestore,
        private dialog: MatDialog,
        private customizationService: CustomizationService,
        private router: Router,
        private ngZone: NgZone,
        private logger: Logger,
        private messagingService: MessagingService
    ) {
        this.user$ = this.userSubject.asObservable();
        this.getAuthState().subscribe();

        this.authState$.subscribe((user) => {
            console.log('Auth State User:', user);
        });
    }

    getAuthState(): Observable<UserWithRole | null> {
        if (this.currentUserData) {
            return of(this.currentUserData);
        }
        return this.authState$.pipe(
            switchMap(user => {
                if (user && !this.currentUserData) {
                    const userDocRef = doc(this.firestore, `institutes/${this.customizationService.getSubdomainFromUrl()}/users/${user.email}`);
                    return from(this.logger.logAndGet(userDocRef, 'AuthService', `institutes/${this.customizationService.getSubdomainFromUrl()}/users`, 'authState')).pipe(
                        map(docSnap => {
                            if (docSnap.exists()) {
                                const userData = docSnap.data() as UserRole; // Cast to UserRole
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
                this.currentUserData = user;
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

                    // Log Firestore Read Operation
                    this.logger.logAndGet(userDocRef, 'AuthService', 'institutes/${this.customizationService.getSubdomainFromUrl()}/users', 'googleSignIn').then((docSnap) => {
                        if (docSnap.exists()) {
                            const userData = docSnap.data() as UserRole; // Cast to UserRole

                            if (userData.status === 'accepted' && userData.role) {
                                console.log('User is accepted and has a valid role. Redirecting to dashboard.');
                                this.dialog.closeAll();
                                this.router.navigate(['/dashboard']).then(() => {
                                    if (this.router.url === '/login') {
                                        window.location.reload();
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

            return result;
        }).catch(error => {
            console.error("Login failed:", error);
            throw error;
        });
    }

    signOut() {
        this.userSubject.next(null);
        this.currentUserData = null;
        this.loginNotificationShown.next(false);
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
                this.router.navigate([this.redirectUrl]);
                this.redirectUrl = null;
            });
        } else {
            this.ngZone.run(() => {
                this.router.navigate(['/dashboard']);
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

        this.logger.addLog({
            type: 'READ',
            module: 'AuthService',
            method: 'getStudents',
            collection: `institutes/${subdomain}/users`,
            dataSize: 0,
            timestamp: new Date().toISOString(),
        });

        return collectionData(studentsQuery);
    }

    saveFCMToken(user: FirebaseUser) {
        console.log('FCM token save called');
        this.messagingService.getToken().then((token) => {
            if (token) {
                const userRef = doc(this.firestore, `institutes/${this.customizationService.getSubdomainFromUrl()}/users/${user.email}`);

                // Log Firestore Read Operation
                this.logger.logAndGet(userRef, 'AuthService', 'institutes/${this.customizationService.getSubdomainFromUrl()}/users', 'saveFCMToken').then((docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data() as UserRole; // Cast to UserRole
                        let tokens = userData['fcmTokens'] || [];
                        if (!tokens.includes(token)) {
                            tokens.push(token);

                            // Log Firestore Write Operation
                            this.logger.logAndSet(userRef, { fcmTokens: tokens }, 'AuthService', 'institutes/${this.customizationService.getSubdomainFromUrl()}/users', 'saveFCMToken').then(() => {
                                console.log('FCM Token added successfully.');
                            }).catch((error) => {
                                console.error('Error saving FCM token: ', error);
                            });
                        } else {
                            console.log('Token already exists.');
                        }
                    } else {
                        this.logger.logAndSet(userRef, { fcmTokens: [token] }, 'AuthService', 'institutes/${this.customizationService.getSubdomainFromUrl()}/users', 'saveFCMToken').then(() => {
                            console.log('FCM Token saved successfully in new user document.');
                        }).catch((error) => {
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
