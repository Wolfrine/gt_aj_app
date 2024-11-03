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
        { "title": "Take Quiz", "imageUrl": "./assets/quiz.png", "color": "rgb(235,255,225)", "route": "/quiz" },
        { "title": "Manage Questionbank", "imageUrl": "./assets/manage-users.webp", "color": "rgb(225,230,245)", "route": "/quiz/view-quiz-databank", "access": "admin" },
        { "title": "Add news", "imageUrl": "./assets/manage-syllabus.png", "color": "rgb(245,220,245)", "route": "/add-news", "access": "admin" },
    ];

    constructor(
        public authService: AuthService,
        private firestore: Firestore,
        private customizationService: CustomizationService,
        private logger: Logger  // Inject Logger service
    ) {
        this.user$ = this.authService.user$;
    }

    ngOnInit() {
        this.user$.subscribe(user => {
            if (user) {
                this.checkAndSavePWAStatus(user);
            }
        });

        // Listen for the 'beforeinstallprompt' event
        window.addEventListener('beforeinstallprompt', (event: Event) => {
            event.preventDefault();
            this.installPromptEvent = event;
            this.showInstallWidget = true;
        });

        // Listen for the 'appinstalled' event
        window.addEventListener('appinstalled', () => {
            this.showInstallWidget = false;
            this.user$.subscribe(user => {
                if (user) {
                    this.savePWAStatus(user, true);
                }
            });
        });
    }

    // Method to trigger PWA installation
    installPWA() {
        if (this.installPromptEvent) {
            this.installPromptEvent.prompt();
            this.installPromptEvent.userChoice.then((choiceResult: { outcome: string }) => {
                if (choiceResult.outcome === 'accepted') {
                    this.user$.subscribe(user => {
                        if (user) {
                            this.savePWAStatus(user, true);
                        }
                    });
                }
                this.installPromptEvent = null;
                this.showInstallWidget = false;
            });
        } else {
            alert("Use the browser's install button from URL to install the app.");
        }
    }

    // Method to check and save PWA installation status
    checkAndSavePWAStatus(user: UserWithRole): void {
        const localStorageKey = `IsPWAInstalled_${this.subdomain}_${user.email}`;
        const storedStatus = localStorage.getItem(localStorageKey);

        if (storedStatus !== null) {
            this.showInstallWidget = storedStatus === 'false';
        } else {
            const userDocRef = doc(this.firestore, `institutes/${this.subdomain}/users/${user.email}`);

            // Log Firestore Read Operation
            this.logger.addLog({
                type: 'READ',
                module: 'DashboardComponent',
                method: 'checkAndSavePWAStatus',
                collection: `institutes/${this.subdomain}/users/${user.email}`,
                dataSize: 0,
                timestamp: new Date().toISOString(),
            });

            getDoc(userDocRef).then(docSnapshot => {
                if (docSnapshot.exists()) {
                    const firestoreStatus = docSnapshot.data()?.['IsPWAInstalled'] || false;
                    localStorage.setItem(localStorageKey, String(firestoreStatus));
                    this.showInstallWidget = !firestoreStatus;
                }
            }).catch(error => {
                console.error('Error fetching PWA status from Firestore:', error);
                this.logger.addLog({
                    type: 'ERROR',
                    module: 'DashboardComponent',
                    method: 'checkAndSavePWAStatus',
                    message: `Error fetching PWA status: ${error.message}`,
                    timestamp: new Date().toISOString(),
                });
            });
        }
    }

    // Method to save PWA installation status
    savePWAStatus(user: UserWithRole, isPWAInstalled: boolean): void {
        const localStorageKey = `IsPWAInstalled_${this.subdomain}_${user.email}`;
        const storedStatus = localStorage.getItem(localStorageKey);

        if (storedStatus !== String(isPWAInstalled)) {
            const userDocRef = doc(this.firestore, `institutes/${this.subdomain}/users/${user.email}`);

            // Log Firestore Write Operation
            this.logger.addLog({
                type: 'WRITE',
                module: 'DashboardComponent',
                method: 'savePWAStatus',
                collection: `institutes/${this.subdomain}/users/${user.email}`,
                dataSize: JSON.stringify({ IsPWAInstalled: isPWAInstalled }).length,
                timestamp: new Date().toISOString(),
            });

            updateDoc(userDocRef, { IsPWAInstalled: isPWAInstalled })
                .then(() => {
                    localStorage.setItem(localStorageKey, String(isPWAInstalled));
                })
                .catch(error => {
                    console.error('Error updating PWA status:', error);
                    this.logger.addLog({
                        type: 'ERROR',
                        module: 'DashboardComponent',
                        method: 'savePWAStatus',
                        message: `Error updating PWA status: ${error.message}`,
                        timestamp: new Date().toISOString(),
                    });
                });
        }
    }
}
