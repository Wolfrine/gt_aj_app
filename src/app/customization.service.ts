import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, DocumentData, QuerySnapshot } from '@angular/fire/firestore';

@Injectable({
    providedIn: 'root'
})
export class CustomizationService {

    constructor(private firestore: Firestore) { }

    async getCustomization(subdomain: string): Promise<any> {
        const cachedData = this.getCachedCustomization(subdomain);
        if (cachedData) {
            return cachedData;
        }

        const col = collection(this.firestore, 'registrations');
        const q = query(col, where('subdomain', '==', subdomain));
        const snapshot = await getDocs(q) as QuerySnapshot<DocumentData>;

        if (snapshot.empty) {
            throw new Error('Subdomain not registered');
        }

        const data = snapshot.docs.map(doc => doc.data())[0];
        this.cacheCustomization(subdomain, data);

        return data;
    }

    private getCachedCustomization(subdomain: string): any {
        const cachedData = localStorage.getItem(`customization_${subdomain}`);
        return cachedData ? JSON.parse(cachedData) : null;
    }

    private cacheCustomization(subdomain: string, data: any): void {
        localStorage.setItem(`customization_${subdomain}`, JSON.stringify(data));
    }
}


