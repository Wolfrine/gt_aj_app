import { Component } from '@angular/core';

import { AuthService } from '../auth.service';

@Component({
    selector: 'app-auth',
    standalone: true,
    imports: [],
    templateUrl: './auth.component.html',
    styleUrl: './auth.component.scss'
})
export class AuthComponent {

    constructor(
        private authService: AuthService
    ) { }

    onGoogleSignIn() {
        this.authService.googleSignIn()
            .then(() => {
                console.log('Successfully logged in');
            })
            .catch((error) => {
                console.error('Error during Google sign-in:', error);
            });
    }

}
