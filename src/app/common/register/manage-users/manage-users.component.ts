import { Component, OnInit } from '@angular/core';
import { Firestore, collectionData, collection, doc, updateDoc } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { CustomizationService } from '../../../customization.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

interface User {
    email: string;
    name: string;
    role: string;
    status: string;
}

@Component({
    selector: 'app-manage-users',
    templateUrl: './manage-users.component.html',
    styleUrls: ['./manage-users.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatDividerModule,
        MatExpansionModule,
        MatIconModule
    ]
})
export class ManageUsersComponent implements OnInit {
    users: User[] = [];

    private subdomain = this.customizationService.getSubdomainFromUrl();

    constructor(
        private firestore: Firestore,
        private customizationService: CustomizationService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        const usersCollection = collection(this.firestore, `institutes/${this.subdomain}/users`);
        collectionData(usersCollection, { idField: 'id' }).pipe(
            map(users => users as User[])
        ).subscribe(users => {
            this.users = users;
        });
    }

    updateUserStatus(user: User, status: string) {
        const userDocRef = doc(this.firestore, `institutes/${this.subdomain}/users/${user.email}`);
        updateDoc(userDocRef, { status }).then(() => {
            this.snackBar.open(`User ${user.name} status updated to ${status}`, 'Close', {
                duration: 3000,
            });
        }).catch(error => {
            console.error("Error updating user status: ", error);
            this.snackBar.open(`Error updating user status`, 'Close', {
                duration: 3000,
            });
        });
    }
}
``
