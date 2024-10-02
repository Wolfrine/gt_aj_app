import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AuthService, UserWithRole } from '../../auth/auth.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-registration-submitted',
    templateUrl: './registration-submitted.component.html',
    styleUrls: ['./registration-submitted.component.scss'],
    standalone: true,
    imports: [CommonModule, MatButtonModule, RouterModule]
})
export class RegistrationSubmittedComponent implements OnInit {
    currentUser$: Observable<UserWithRole | null> = this.authService.getCurrentUser();
    adminMessage: string | null = null;

    constructor(private authService: AuthService) { }

    ngOnInit(): void {
        // Fetch the current user and check for any admin message
        this.currentUser$.subscribe(user => {
            if (user && user.adminMessage) {
                this.adminMessage = user.adminMessage;
            }
        });
    }
}
