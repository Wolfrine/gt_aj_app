import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of, from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { CustomizationService } from '../../customization.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private firestore: Firestore,
        private customizationService: CustomizationService,
        private router: Router
    ) { }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        const expectedRoles = next.data['expectedRoles'] as string[] || [];
        console.log('expectedRoles in canActivate:', expectedRoles);

        return this.authService.isAuthenticated().pipe(
            switchMap(isAuthenticated => {
                if (!isAuthenticated) {
                    this.router.navigate(['/unauthorized']);
                    return of(false);
                }

                return this.authService.getUserRole().pipe(
                    switchMap(role => {
                        console.log('role guard:', role);
                        console.log('expectedRoles:', expectedRoles);

                        if (!role || role === 'user') {
                            return of(false);
                        }

                        // If expectedRoles is empty, allow access if the user has any role other than 'user'
                        if (expectedRoles.length === 0) {
                            return this.checkUserStatus(role);
                        }

                        // Otherwise, allow access if the user's role is in the expected roles
                        if (expectedRoles.includes(role)) {
                            return this.checkUserStatus(role);
                        } else {
                            return of(false);
                        }
                    }),
                    tap(isAuthorized => {
                        if (!isAuthorized) {
                            this.router.navigate(['/unauthorized']);
                        }
                    })
                );
            })
        );
    }

    private checkUserStatus(role: string): Observable<boolean> {
        const subdomain = this.customizationService.getSubdomainFromUrl();
        return this.authService.getCurrentUser().pipe(
            switchMap(user => {
                if (user) {
                    const userDocRef = doc(this.firestore, `institutes/${subdomain}/users/${user.email}`);
                    return from(getDoc(userDocRef)).pipe(
                        map(docSnap => {
                            if (docSnap.exists()) {
                                const userData = docSnap.data() as any;
                                return userData.status === 'accepted';
                            }
                            return false;
                        })
                    );
                }
                return of(false);
            })
        );
    }
}
