import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Firestore, collection, query, where, getDocs, DocumentData, QuerySnapshot, doc, getDoc, DocumentSnapshot } from '@angular/fire/firestore';
import { Logger } from './logger.service';  // Import Logger service

// Define the expected data structure
interface RegistrationData {
    faviconUrl?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CustomizationService {
    private isLocalStorageAvailable: boolean;

    constructor(
        private firestore: Firestore,
        @Inject(PLATFORM_ID) private platformId: Object,
        private logger: Logger  // Inject Logger
    ) {
        this.isLocalStorageAvailable = this.checkLocalStorageAvailability();
    }

    private checkLocalStorageAvailability(): boolean {
        if (isPlatformBrowser(this.platformId)) {
            try {
                const testKey = 'test';
                localStorage.setItem(testKey, 'testValue');
                localStorage.removeItem(testKey);
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    async getCustomization(subdomain: string): Promise<any> {
        console.log('getCustomization');
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

        console.error(`registration found for subdomain: ${subdomain}`);

        const data = snapshot.docs.map(doc => doc.data())[0];
        this.cacheCustomization(subdomain, data);

        // Log the read operation
        this.logger.addLog({
            type: 'READ',
            module: 'CustomizationService',
            collection: 'registrations',
            dataSize: snapshot.size, // Size of data fetched
            timestamp: new Date().toISOString(),
        });

        return data;
    }

    private getCachedCustomization(subdomain: string): any {
        if (this.isLocalStorageAvailable) {
            const cachedData = localStorage.getItem(`customization_${subdomain}`);
            return cachedData ? JSON.parse(cachedData) : null;
        }
        return null;
    }

    cacheCustomization(subdomain: string, data: any): void {
        if (this.isLocalStorageAvailable) {
            localStorage.setItem(`customization_${subdomain}`, JSON.stringify(data));
        }
    }

    getSubdomainFromUrl(): string {
        const host = window.location.host;
        const subdomain = host.split('.')[0];
        return subdomain;
    }

    async getFaviconUrl(subdomain: string): Promise<string> {
        const docRef = doc(this.firestore, `registrations/${subdomain}`);

        // Cast to DocumentSnapshot with the RegistrationData interface
        const docSnap = await this.logger.logAndGet(docRef, 'CustomizationService', 'getFaviconUrl', 'registrations') as DocumentSnapshot<RegistrationData>;

        if (docSnap.exists()) {
            const data = docSnap.data() as RegistrationData;  // Explicitly cast to RegistrationData
            return data?.faviconUrl || '';
        }
        return '';
    }
}
