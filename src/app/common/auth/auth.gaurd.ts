import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        return this.authService.user$.pipe(
            map(user => !!user),
            tap(loggedIn => {
                if (!loggedIn) {
                    console.log(state.url);
                    this.authService.redirectUrl = state.url;  // Capture the requested URL
                    this.authService.redirectToLogin();
                }
            })
        );
    }
}
