import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs, QuerySnapshot, DocumentData } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { CustomizationService } from '../../customization.service';
import { Logger } from '../../logger.service';  // Import Logger service

@Component({
    selector: 'app-register',
    template: '',
})
export class RegisterComponent implements OnInit {
    private router = inject(Router);
    private firestore = inject(Firestore);
    private authService = inject(AuthService);
    private customizationService = inject(CustomizationService);
    private logger = inject(Logger); // Inject Logger

    async ngOnInit() {
        this.authService.user$.subscribe(async (user) => {
            if (user) {
                const instituteName = this.customizationService.getSubdomainFromUrl();
                const usersCollection = collection(this.firestore, `institutes/${instituteName}/users`);
                const q = query(usersCollection, where('email', '==', user.email));

                // Log Firestore Read Operation
                this.logger.addLog({
                    type: 'READ',
                    module: 'RegisterComponent',
                    method: 'ngOnInit',
                    collection: `institutes/${instituteName}/users`,
                    dataSize: 0,  // Data size can be adjusted if needed
                    timestamp: new Date().toISOString(),
                });

                // Perform Firestore read operation
                const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

                if (!querySnapshot.empty) {
                    // User already registered
                    this.router.navigate(['/register/submitted']);
                } else {
                    // New registration
                    this.router.navigate(['/register/new']);
                }
            }
        });
    }
}
