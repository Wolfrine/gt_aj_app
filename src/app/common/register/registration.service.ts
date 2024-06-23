import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc } from '@angular/fire/firestore';
import { CustomizationService } from '../../customization.service';

@Injectable({
    providedIn: 'root'
})
export class RegistrationService {
    constructor(private firestore: Firestore, private customizationService: CustomizationService) { }

    async register(user: any): Promise<void> {
        const subdomain = this.customizationService.getSubdomainFromUrl();
        const instituteDocRef = doc(this.firestore, `institutes/${subdomain}`);
        const usersCollection = collection(instituteDocRef, 'users');
        const userDocRef = doc(usersCollection, user.email); // Assuming email is unique and used as document ID
        await setDoc(userDocRef, user);
    }
}
