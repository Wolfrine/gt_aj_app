import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { environment } from '../environments/environment';
import { isPlatformBrowser } from '@angular/common';  // Import to check platform
import { FirebaseApp } from '@angular/fire/app';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})
export class MessagingService {
    messaging: any; // Declare without initializing

    constructor(
        private firebaseApp: FirebaseApp,
        private _snackBar: MatSnackBar,
        @Inject(PLATFORM_ID) private platformId: Object  // Inject platform id
    ) {
        if (isPlatformBrowser(this.platformId)) {  // Only run in the browser
            this.messaging = getMessaging(this.firebaseApp);
            navigator.serviceWorker.ready.then((registration) => {
                if (registration.active) {
                    console.log('Service Worker is active');
                    this.requestPermission(registration);
                } else {
                    console.log('Waiting for the Service Worker to activate');
                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                        console.log('Service Worker activated, requesting permission');
                        this.requestPermission(registration);
                    });
                }
            });
        } else {
            console.log('Not running in browser, Firebase Messaging not initialized.');
        }
    }

    getToken(): Promise<string | null> {
        if (isPlatformBrowser(this.platformId)) {
            return getToken(this.messaging, {
                vapidKey: environment.firebaseConfig.vapidKey,
            }).then((currentToken) => {
                if (currentToken) {
                    return currentToken;
                } else {
                    console.warn('No registration token available.');
                    return null;
                }
            }).catch((err) => {
                console.error('Error retrieving token', err);
                return null;
            });
        } else {
            return Promise.resolve(null);
        }
    }

    requestPermission(registration: ServiceWorkerRegistration) {
        if (isPlatformBrowser(this.platformId)) {  // Ensure this only runs in the browser
            getToken(this.messaging, {
                vapidKey: environment.firebaseConfig.vapidKey,
                serviceWorkerRegistration: registration
            })
                .then((currentToken) => {
                    if (currentToken) {
                        console.log('Token received: ', currentToken);
                    } else {
                        console.warn('No registration token available. Request permission to generate one.');
                    }
                })
                .catch((err) => {
                    console.error('Error retrieving token', err);
                });
        }
    }

    listenForMessages() {
        if (isPlatformBrowser(this.platformId)) {
            onMessage(this.messaging, (payload) => {
                console.log('Message received. ', payload);

                // Check if payload.notification exists
                if (payload.notification) {
                    const { title, body, icon } = payload.notification;

                    // Display the notification using a snackbar or browser notification
                    this._snackBar.open(title || 'Notification', 'Close', {
                        duration: 5000,
                    });

                    // Optional: If you want to display a native browser notification
                    if (Notification.permission === 'granted') {
                        new Notification(title || 'Notification', {
                            body: body || 'You have a new message.',
                            icon: icon || '/assets/icons/icon-192x192.png',
                        });
                    }
                    else {
                        console.log("Not able to show browser notification");
                    }
                } else {
                    console.warn('Received message payload without notification:', payload);
                }
            });
        }
    }
}
