import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CustomizationService } from './customization.service';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        RouterOutlet,
        MatToolbarModule
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    title = 'Fetching...';
    themeColor = 'defaultColor';
    header = 'defaultHeader';

    constructor(private customizationService: CustomizationService, private titleService: Title) { }

    async ngOnInit() {
        if (typeof window !== "undefined") {
            const subdomain = this.getSubdomainFromUrl();
            try {
                const data = await this.customizationService.getCustomization(subdomain);
                if (data) {
                    this.title = data.websiteTitle;
                    this.themeColor = data.themeColor;
                    this.header = data.header;
                    this.applyThemeColor();
                    this.setTitle(data.websiteTitle);
                }
            } catch (error: any) {
                if (error.message === 'Subdomain not registered') {
                    this.redirectToRegistration(subdomain);
                } else {
                    console.error(error);
                }
            }
        }
    }

    getSubdomainFromUrl(): string {
        const host = window.location.host;
        const subdomain = host.split('.')[0];
        return subdomain;
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
}