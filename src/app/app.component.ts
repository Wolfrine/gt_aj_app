import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CustomizationService } from './customization.service';
import { Title } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthComponent } from './auth/auth.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        RouterOutlet,
        MatToolbarModule,
        CommonModule,
        AuthComponent
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

    constructor(
        private customizationService: CustomizationService,
        private titleService: Title,
        private location: Location,
        private router: Router,
        private viewportScroller: ViewportScroller,
        private _snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {
        console.log('AppComponent constructor');
    }

    openSignIn() {
        this.dialog.open(AuthComponent);
    }

    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action);
    }

    async ngOnInit() {

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
                this.title = data.websiteTitle;
                this.themeColor = data.themeColor;
                this.header = data.header;
                this.applyThemeColor();
                this.setTitle(data.websiteTitle);
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
    }

    checkhome() {
        if (this.location.path() == '/home' || this.location.path() == '/')
            return false
        else
            return true
    }



    applyThemeColor() {
        const metaThemeColor = document.querySelector("meta[name=theme-color]") as HTMLMetaElement;
        document.documentElement.style.setProperty('--theme-color', this.themeColor);
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", this.themeColor);
        } else {
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = this.themeColor;
            document.getElementsByTagName('head')[0].appendChild(meta);
        }
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
