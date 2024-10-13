import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../common/auth/auth.service';
import { Observable } from 'rxjs';
import { UserWithRole } from '../common/auth/auth.service';
import { NewsEventsComponent } from '../news-events/news-events.component';

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
    ) {
        this.user$ = this.authService.user$;
    }

    ngOnInit() {
        // Listen for the 'beforeinstallprompt' event
        window.addEventListener('beforeinstallprompt', (event: Event) => {
            console.log('beforeinstallprompt event fired');  // Log event
            event.preventDefault(); // Prevent the default install prompt
            this.installPromptEvent = event; // Store the event for triggering later
            this.showInstallWidget = true; // Show your custom install widget
        });

        // Check if already installed (for desktop debugging)
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.showInstallWidget = false;
        });
    }

    // Trigger the installation prompt when the user clicks the install button
    installPWA() {
        if (this.installPromptEvent) {
            this.installPromptEvent.prompt(); // Show the native install prompt
            this.installPromptEvent.userChoice.then((choiceResult: { outcome: string }) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the PWA installation');
                } else {
                    console.log('User dismissed the PWA installation');
                }
                this.installPromptEvent = null; // Reset the event
                this.showInstallWidget = false; // Hide the install widget after interaction
            });
        } else {
            console.warn('Install prompt event not captured');
            alert('Use the browser\'s install button from URL to install the app.');
        }
    }
}
