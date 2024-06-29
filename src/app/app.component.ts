import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, Inject, PLATFORM_ID, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        RouterOutlet,
        MatToolbarModule,
        CommonModule,
        CKEditorModule,
        ObservationListComponent,
        MatMenuModule,
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent implements OnInit {
    title = '';
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
    ) {
        console.log('AppComponent constructor');
    }

    homeroute() {
        if (this.user) {
            this.router.navigate(['/dashboard']);
        }
        else {
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
        this._snackBar.open(message, action,
            {
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
        });

        let subdomain = '';
        if (typeof window !== 'undefined') {
            subdomain = this.customizationService.getSubdomainFromUrl();
        }
        try {
            const data = await this.customizationService.getCustomization(subdomain);
            if (data) {
                console.log(data);
                this.title = data.websiteTitle;
                this.themeColor = data.themeColor;
                this.header = data.header;
                this.applyThemeColor();
                this.setTitle(data.websiteTitle);
                this.setFavicon(data.faviconUrl);
                console.log(data.status);
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
            console.log(params['obsl']);
            this.showObservationList = params['obsl'] === '1';
        });
    }

    // Display navbar in all pages other than /home
    checkhome() {
        if (this.location.path() == '/home' || this.location.path() == '/' || this.location.path().includes('/home'))
            return false
        else
            return true
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

        this.renderer.setStyle(document.documentElement, '--theme-color', this.themeColor);

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
        console.log(url);
        const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = url;
        document.getElementsByTagName('head')[0].appendChild(link);
    }


    setTitle(newTitle: string) {
        this.titleService.setTitle(newTitle);
    }

    redirectToRegistration(subdomain: string) {
        window.location.href = `https://register.growthtutorials.in/register?request=${subdomain}`;
    }

    redirectToInstitutes(subdomain: string) {
        window.location.href = `https://register.growthtutorials.in/institutes?request=${subdomain}`;
    }


}
