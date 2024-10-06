import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc } from '@angular/fire/firestore';
import { CustomizationService } from '../../customization.service';
import { Logger } from '../../logger.service';  // Import Logger service

@Injectable({
    providedIn: 'root'
})
export class RegistrationService {
    constructor(private firestore: Firestore, private customizationService: CustomizationService, private logger: Logger) { }  // Inject Logger

    async register(user: any): Promise<void> {
        const subdomain = this.customizationService.getSubdomainFromUrl();
        const instituteDocRef = doc(this.firestore, `institutes/${subdomain}`);
        const usersCollection = collection(instituteDocRef, 'users');
        const userDocRef = doc(usersCollection, user.email); // Assuming email is unique and used as document ID

        // Log Firestore Write Operation
        this.logger.addLog({
            type: 'WRITE',
            module: 'RegistrationService',
            method: 'register',
            collection: `institutes/${subdomain}/users`,
            dataSize: JSON.stringify(user).length, // Log size of the data being written
            timestamp: new Date().toISOString(),
        });

        await setDoc(userDocRef, user);
    }
}
