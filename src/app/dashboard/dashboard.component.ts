import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../common/auth/auth.service';
import { Observable } from 'rxjs';
import { UserWithRole } from '../common/auth/auth.service';
import { NewsEventsComponent } from '../news-events/news-events.component';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Logger } from '../logger.service';
import { CustomizationService } from '../customization.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, NewsEventsComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

    user$!: Observable<UserWithRole | null>;
    installPromptEvent: any = null;
    showInstallWidget = true;
    subdomain = this.customizationService.getSubdomainFromUrl();

    actionlist = [
        { "title": "Add Activity", "imageUrl": "./assets/activities.png", "color": "rgb(245,245,220)", "route": "/add-activity" },
        { "title": "Manage Syllabus", "imageUrl": "./assets/manage-syllabus.png", "color": "rgb(245,220,245)", "route": "/manage-syllabus", "access": "admin" },
        { "title": "Manage Users", "imageUrl": "./assets/manage-users.png", "color": "rgb(220,245,245)", "route": "/manage-users", "access": "admin" },
        { "title": "Take Quiz", "imageUrl": "./assets/quiz.png", "color": "rgb(235,255,225)", "route": "/quiz/basic-quiz" },
        { "title": "Manage Questionbank", "imageUrl": "./assets/manage-users.webp", "color": "rgb(225,230,245)", "route": "/quiz/view-quiz-databank", "access": "admin" },
        { "title": "Add news", "imageUrl": "./assets/manage-syllabus.png", "color": "rgb(245,220,245)", "route": "/add-news", "access": "admin" },
    ];

    constructor(
        public authService: AuthService,
        private firestore: Firestore,  // Inject Firestore to update user info
        private customizationService: CustomizationService
    ) {
        this.user$ = this.authService.user$;
    }

    ngOnInit() {
        this.user$.subscribe(user => {
            if (user) {
                this.checkAndSavePWAStatus(user); // Call method on login
            }
        });

        // Listen for the 'beforeinstallprompt' event
        window.addEventListener('beforeinstallprompt', (event: Event) => {
            event.preventDefault(); // Prevent the default install prompt
            this.installPromptEvent = event; // Store the event for triggering later
            this.showInstallWidget = true; // Show your custom install widget
        });

        // Check if already installed (for desktop debugging)
        window.addEventListener('appinstalled', () => {
            this.showInstallWidget = false;
            this.user$.subscribe(user => {
                if (user) {
                    this.savePWAStatus(user, true); // Save PWA status when installed
                }
            });
        });
    }

    // Method to trigger PWA installation
    installPWA() {
        if (this.installPromptEvent) {
            this.installPromptEvent.prompt(); // Show the native install prompt
            this.installPromptEvent.userChoice.then((choiceResult: { outcome: string }) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the PWA installation');
                    this.user$.subscribe(user => {
                        if (user) {
                            this.savePWAStatus(user, true); // Save the status after installation
                        }
                    });
                } else {
                    console.log('User dismissed the PWA installation');
                }
                this.installPromptEvent = null; // Reset the event
                this.showInstallWidget = false; // Hide the install widget after interaction
            });
        } else {
            alert('Use the browser\'s install button from URL to install the app.');
        }
    }

    // Method to check and save PWA installation status
    checkAndSavePWAStatus(user: UserWithRole): void {

        const localStorageKey = `IsPWAInstalled_${this.subdomain}_${user.email}`;
        const storedStatus = localStorage.getItem(localStorageKey);

        if (storedStatus !== null) {
            console.log('Using cached PWA status from localStorage:', storedStatus);
            this.showInstallWidget = storedStatus === 'false';
        } else {
            // Fetch from Firestore
            const userDocRef = doc(this.firestore, `institutes/${this.subdomain}/users/${user.email}`);
            getDoc(userDocRef).then(docSnapshot => {
                if (docSnapshot.exists()) {
                    const firestoreStatus = docSnapshot.data()?.['IsPWAInstalled'] || false;
                    localStorage.setItem(localStorageKey, String(firestoreStatus)); // Cache the status
                    this.showInstallWidget = !firestoreStatus;
                }
            }).catch(error => console.error('Error fetching PWA status from Firestore:', error));
        }
    }

    // Method to save PWA installation status
    savePWAStatus(user: UserWithRole, isPWAInstalled: boolean): void {
        const localStorageKey = `IsPWAInstalled_${this.subdomain}_${user.email}`;
        const storedStatus = localStorage.getItem(localStorageKey);

        if (storedStatus !== String(isPWAInstalled)) {
            // Update Firestore and local storage if status has changed
            const userDocRef = doc(this.firestore, `institutes/${this.subdomain}/users/${user.email}`);
            updateDoc(userDocRef, { IsPWAInstalled: isPWAInstalled })
                .then(() => {
                    console.log(`PWA status updated for ${user.email} in ${this.subdomain}`);
                    localStorage.setItem(localStorageKey, String(isPWAInstalled)); // Update local storage
                })
                .catch(error => console.error('Error updating PWA status:', error));
        }
    }
}
