import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        const expectedRoles = next.data['expectedRoles'] as string[] || [];

        return this.authService.getUserRole().pipe(
            map(role => expectedRoles.includes(role)),
            tap(isAuthorized => {
                if (!isAuthorized) {
                    this.router.navigate(['/unauthorized']);
                }
            })
        );
    }
}
