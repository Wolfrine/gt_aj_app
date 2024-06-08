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


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        RouterOutlet,
        MatToolbarModule,
        CommonModule
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

    constructor(
        private customizationService: CustomizationService,
        private titleService: Title,
        private location: Location,
        private router: Router,
        private viewportScroller: ViewportScroller) {
        console.log('AppComponent constructor');
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
                if (data.status === 'disabled') {
                    this.redirectToInstitutes(subdomain);
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
        document.documentElement.style.setProperty('--theme-color', this.themeColor);
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
