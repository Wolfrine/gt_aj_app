import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { from, Observable, of } from 'rxjs';
import { map, switchMap, tap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { CustomizationService } from '../../customization.service';
import { Logger } from '../../logger.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {

    private cachedUserStatus: { [email: string]: boolean } = {};

    constructor(
        private authService: AuthService,
        private firestore: Firestore,
        private customizationService: CustomizationService,
        private router: Router,
        private logger: Logger
    ) { }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        const expectedRoles = next.data['expectedRoles'] as string[] || [];

        return this.authService.getAuthState().pipe(
            switchMap(user => {
                if (!user) {
                    this.router.navigate(['/unauthorized']);
                    return of(false);
                }

                return this.authService.getUserRole().pipe(
                    take(1),
                    switchMap(role => {
                        if (!role || role === 'user') {
                            return of(false);
                        }

                        if (expectedRoles.length === 0) {
                            return this.checkUserStatus(role, user.email!);
                        }

                        if (expectedRoles.includes(role)) {
                            return this.checkUserStatus(role, user.email!);
                        } else {
                            return of(false);
                        }
                    }),
                    tap(isAuthorized => {
                        if (!isAuthorized) {
                            this.router.navigate(['/register']);
                        }
                    })
                );
            })
        );
    }

    private checkUserStatus(role: string, email: string): Observable<boolean> {
        const subdomain = this.customizationService.getSubdomainFromUrl();

        if (this.cachedUserStatus[email]) {
            return of(this.cachedUserStatus[email]);
        }

        const userDocRef = doc(this.firestore, `institutes/${subdomain}/users/${email}`);
        return from(this.logger.logAndGet(userDocRef, 'RoleGuard', `institutes/${subdomain}/users`, 'checkUserStatus')).pipe(
            map(docSnap => {
                if (docSnap.exists()) {
                    const userData = docSnap.data() as { status: string };
                    const isAccepted = userData.status === 'accepted';
                    this.cachedUserStatus[email] = isAccepted;
                    return isAccepted;
                }
                return false;
            })
        );
    }
}
