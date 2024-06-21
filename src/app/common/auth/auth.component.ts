import { Component, Optional } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from './auth.service';

@Component({
    selector: 'app-auth',
    standalone: true,
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss']
})
export class AuthComponent {

    constructor(
        private authService: AuthService,
        @Optional() private dialogRef: MatDialogRef<AuthComponent>
    ) { }

    onGoogleSignIn() {
        this.authService.googleSignIn()
            .then(() => {
                console.log('Successfully logged in');
                if (this.dialogRef) {
                    this.dialogRef.close();
                }
                this.authService.handlePostLoginRedirect();  // Handle post-login redirect
            })
            .catch((error) => {
                console.error('Error during Google sign-in:', error);
            });
    }

    onCancel(): void {
        if (this.dialogRef) {
            this.dialogRef.close();
        } else {
            this.authService.redirectToLogin();
        }
    }

    ngOnInit() {
        this.authService.user$.subscribe({
            next: user => {
                if (user) {
                    if (this.dialogRef) {
                        this.dialogRef.close();
                    } else {
                        this.authService.handlePostLoginRedirect();  // Handle post-login redirect
                    }
                }
            }
        });
    }
}
