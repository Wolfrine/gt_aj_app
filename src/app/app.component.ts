import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, Inject, PLATFORM_ID, Renderer2, ElementRef } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CustomizationService } from './customization.service';
import { Title } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ObservationListComponent } from './common/observation-list/observation-list.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from './common/auth/auth.service';
import { User } from '@angular/fire/auth';
import { MatMenuModule } from '@angular/material/menu';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Logger } from './logger.service';  // Import Logger service
import { MessagingService } from './messaging.service';

@Component({
    selector: 'app-root',
    standalone: true,
    providers: [Logger],  // Add Logger globally here
    imports: [
        RouterOutlet,
        MatToolbarModule,
        CommonModule,
        CKEditorModule,
        ObservationListComponent,
        MatMenuModule,
        RouterModule
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent implements OnInit {
    title = 'GT Gurukul';
    themeColor = '#3f51b5';
    header = 'defaultHeader';
    location_path = '';
    subdomainChecked = false; // Flag to indicate subdomain check status
    showObservationList = false;
    user: User | null = null;

    constructor(
        private customizationService: CustomizationService,
        private titleService: Title,
        private location: Location,
        private router: Router,
        private viewportScroller: ViewportScroller,
        private _snackBar: MatSnackBar,
        private route: ActivatedRoute,
        private authService: AuthService,
        @Inject(PLATFORM_ID) private platformId: Object,
        private renderer: Renderer2,
        private elRef: ElementRef,
        private messagingService: MessagingService,
        @Inject(DOCUMENT) private document: Document
    ) {
    }

    homeroute() {
        if (this.user) {
            this.router.navigate(['/dashboard']);
        } else {
            this.router.navigate(['/home']);
        }
    }

    openSignIn() {
        this.authService.openAuthDialog();
    }

    onSignOut() {
        this.user = null;
        this.authService.signOut()
            .then(() => {
                console.log('Successfully logged out');
                this.openSnackBar("Successfully logged out", "Cancel");
            })
            .catch((error) => {
                console.error('Error during sign out:', error);
            });
    }

    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action, {
            duration: 2000
        });
    }

    async ngOnInit() {


        this.authService.user$.subscribe(user => {
            if (user) {
                this.user = user;
                this.authService.getLoginNotificationShown().subscribe(shown => {
                    if (!shown) {
                        this.openSnackBar(`Logged in as ${user.displayName}`, 'Cancel');
                        this.authService.setLoginNotificationShown(true);
                    }
                });
            }
        });

        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.viewportScroller.scrollToPosition([0, 0]);

            // Get subdomain
            let subdomain = '';
            if (typeof window !== 'undefined') {
                subdomain = this.customizationService.getSubdomainFromUrl();
            }

            // Get the route title and set the full page title with subdomain
            this.route.firstChild?.data.subscribe(data => {
                const pageTitle = data['title'] || 'Untitled';
                this.setTitleWithSubdomain(subdomain, pageTitle);
            });
        });


        if (isPlatformBrowser(this.platformId)) {
            console.log('zzzzzzzzz');
            if ('serviceWorker' in navigator) {
                try {
                    const registrationPromise: Promise<ServiceWorkerRegistration> = navigator.serviceWorker.ready;

                    // Timeout to detect a hanging registration
                    const timeout = new Promise<ServiceWorkerRegistration>((_, reject) =>
                        setTimeout(() => reject(new Error('Service worker ready timed out')), 1000)
                    );

                    // Wait with timeout fallback
                    const registration = await Promise.race([registrationPromise, timeout]) as ServiceWorkerRegistration;

                    console.log('Service worker registered:', registration);
                    this.messagingService.requestPermission(registration);
                } catch (error) {
                    console.error('Service Worker registration failed or timed out:', error);
                }
            } else {
                console.warn('Service Workers are not supported by this browser.');
            }
            console.log('zzzzzzzzz');  // This will print if there is no error
        }



        let subdomain = '';
        if (typeof window !== 'undefined') {
            subdomain = this.customizationService.getSubdomainFromUrl();
        }

        try {
            const data = await this.customizationService.getCustomization(subdomain);
            if (data) {

                this.title = data.websiteTitle;
                this.themeColor = data.themeColor;
                this.header = data.header;
                this.applyThemeColor();
                this.setFavicon(data.faviconUrl);
                this.updateManifest(data.websiteTitle, this.themeColor);
                if (data.status === 'disabled' || data.status === 'pending') {
                    this.redirectToRegistration(subdomain);
                } else {
                    this.subdomainChecked = true; // Set flag to true after successful check
                }
            }
        } catch (error: any) {
            if (error.message === 'Subdomain not registered') {
                this.redirectToRegistration(subdomain);
            } else {
                console.error(error);
            }
        }

        // --- Show observation list when obsl variable is passed from URL
        this.route.queryParams.subscribe(params => {
            this.showObservationList = params['obsl'] === '1';
        });
    }


    // Display navbar in all pages other than /home
    checkhome() {
        if (this.location.path() == '/home' || this.location.path() == '/' || this.location.path().includes('/home'))
            return false;
        else
            return true;
    }

    ngAfterViewInit() {
        setTimeout(() => {
            if (isPlatformBrowser(this.platformId)) {
                this.applyThemeColor();
            }
        }, 0); // Delay to ensure DOM is ready
    }

    applyThemeColor() {
        const head = this.elRef.nativeElement.ownerDocument.head;
        const metaThemeColor = head.querySelector("meta[name=theme-color]");

        this.renderer.setStyle(this.document.documentElement, '--theme-color', this.themeColor);
        this.document.documentElement.style.setProperty('--theme-color', this.themeColor);

        if (metaThemeColor) {
            this.renderer.setAttribute(metaThemeColor, 'content', this.themeColor);
        } else {
            const meta = this.renderer.createElement('meta');
            this.renderer.setAttribute(meta, 'name', 'theme-color');
            this.renderer.setAttribute(meta, 'content', this.themeColor);
            this.renderer.appendChild(head, meta);
        }
    }

    private setFavicon(url: string): void {
        const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = url;
        document.getElementsByTagName('head')[0].appendChild(link);
    }

    // New method to update title with subdomain
    private setTitleWithSubdomain(subdomain: string, pageTitle: string) {
        const capitalizedSubdomain = subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
        const fullTitle = `${capitalizedSubdomain} - ${pageTitle}`;
        this.titleService.setTitle(fullTitle);
    }

    // Method to update manifest dynamically
    private updateManifest(appName: string, themeColor: string) {
        const baseUrl = window.location.origin;  // Get base URL of the site
        const manifest = {
            "name": appName || "Default Name",
            "short_name": appName || "Default Name",
            "theme_color": themeColor || "#1976d2",
            "background_color": "#fafafa",
            "display": "standalone",
            "scope": `${baseUrl}/`,  // Use absolute URL for scope
            "start_url": `${baseUrl}/`,  // Use absolute URL for start_url
            "icons": [
                {
                    "src": `${baseUrl}/assets/icons/icon-48-48.png`,  // Use absolute path for icon
                    "sizes": "48x48",
                    "type": "image/png",
                    "purpose": "maskable any"
                },
                {
                    "src": `${baseUrl}/assets/icons/icon-72-72.png`,
                    "sizes": "72x72",
                    "type": "image/png",
                    "purpose": "maskable any"
                },
                {
                    "src": `${baseUrl}/assets/icons/icon-96-96.png`,
                    "sizes": "96x96",
                    "type": "image/png",
                    "purpose": "maskable any"
                },
                {
                    "src": `${baseUrl}/assets/icons/icon-144-144.png`,
                    "sizes": "144x144",
                    "type": "image/png",
                    "purpose": "maskable any"
                },
                {
                    "src": `${baseUrl}/assets/icons/icon-192-192.png`,
                    "sizes": "192x192",
                    "type": "image/png",
                    "purpose": "maskable any"
                },
                {
                    "src": `${baseUrl}/assets/icons/icon-512-512.png`,
                    "sizes": "512x512",
                    "type": "image/png",
                    "purpose": "maskable any"
                }
            ]
        };

        const stringManifest = JSON.stringify(manifest);
        const blob = new Blob([stringManifest], { type: 'application/json' });
        const manifestURL = URL.createObjectURL(blob);

        const link = document.querySelector('link[rel="manifest"]');
        if (link) {
            link.setAttribute('href', manifestURL);
        }
    }


    redirectToRegistration(subdomain: string) {
        window.location.href = `https://register.growthtutorials.in/register?request=${subdomain}`;
    }

    redirectToInstitutes(subdomain: string) {
        window.location.href = `https://register.growthtutorials.in/institutes?request=${subdomain}`;
    }
}
