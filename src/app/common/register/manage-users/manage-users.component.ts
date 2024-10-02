import { Component, Inject, OnInit } from '@angular/core';
import { Firestore, collectionData, collection, doc, updateDoc } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet'; // Import for Bottom Sheet
import { map } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { CustomizationService } from '../../../customization.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms'; // Needed for ngModel
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input'; // For matInput directive

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
        MatIconModule,
        FormsModule
    ]
})
export class ManageUsersComponent implements OnInit {
    users: User[] = [];
    private subdomain = this.customizationService.getSubdomainFromUrl();

    constructor(
        private firestore: Firestore,
        private customizationService: CustomizationService,
        private snackBar: MatSnackBar,
        private bottomSheet: MatBottomSheet // Inject BottomSheet
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
        // Open bottom sheet for admin message
        const bottomSheetRef = this.bottomSheet.open(AdminMessageSheet, {
            data: { user, status }
        });

        bottomSheetRef.afterDismissed().subscribe(result => {
            if (result?.message) {
                const userDocRef = doc(this.firestore, `institutes/${this.subdomain}/users/${user.email}`);
                updateDoc(userDocRef, { status, adminMessage: result.message }).then(() => {
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
        });
    }
}

// Bottom Sheet for Admin Message
@Component({
    selector: 'admin-message-sheet',
    template: `
    <h3>Message for {{data.user.name}} - {{data.status}}</h3>
    <mat-form-field appearance="fill" class="full-width">
      <mat-label>Admin Message</mat-label>
      <textarea matInput [(ngModel)]="adminMessage"></textarea>
    </mat-form-field>
    <div class="actions">
      <button mat-button color="primary" (click)="submit()">Submit</button>
      <button mat-button (click)="cancel()">Cancel</button>
    </div>
  `,
    styles: [`
    .full-width {
      width: 100%;
    }
    .actions {
      display: flex;
      justify-content: space-between;
    }
  `],
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatButtonModule,
        MatInputModule, // Importing MatInputModule for matInput directive
        FormsModule]
})
export class AdminMessageSheet {
    adminMessage = '';

    constructor(
        private bottomSheetRef: MatBottomSheetRef<AdminMessageSheet>,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: { user: User, status: string }
    ) { }

    submit() {
        this.bottomSheetRef.dismiss({ message: this.adminMessage });
    }

    cancel() {
        this.bottomSheetRef.dismiss();
    }
}
