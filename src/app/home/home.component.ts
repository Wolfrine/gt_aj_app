import { Component, HostListener, OnInit, Inject, Renderer2 } from '@angular/core';
import { CustomizationService } from '../customization.service';
import { NewsEventsComponent } from '../news-events/news-events.component';
import { MatDividerModule } from '@angular/material/divider';
import { DOCUMENT } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        NewsEventsComponent,
        MatDividerModule,
        MatButtonModule
    ],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
    subdomain = '';
    about = '';

    constructor(
        @Inject(DOCUMENT) private document: Document,
        private renderer: Renderer2,
        private customizationService: CustomizationService,
        private authService: AuthService
    ) { }

    openSignIn(): void {
        this.authService.openAuthDialog();
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        const header = document.getElementById('header');
        const stickyNav = document.getElementById('sticky-nav');
        const spacer = document.getElementById('spacer');
        const scrollPosition = window.pageYOffset;

        if (header && spacer) {
            const maxScroll = header.offsetHeight - 60;
            const newFontSize = Math.max(32, 50 - ((50 - 32) * (scrollPosition / maxScroll)));
            const newSpacerHeight = Math.min(scrollPosition);

            header.querySelector('h1')!.style.fontSize = `${newFontSize}px`;
            spacer.style.height = `${newSpacerHeight}px`;
            header.style.opacity = scrollPosition >= maxScroll ? '0' : '1';
        }

        if (stickyNav) {
            stickyNav.style.opacity = scrollPosition >= (header?.offsetHeight || 0) - 60 ? '1' : '0';
        }
    }

    async ngOnInit(): Promise<void> {
        if (typeof window !== 'undefined') {
            this.subdomain = this.customizationService.getSubdomainFromUrl();

            try {
                const customization = await this.customizationService.getCustomization(this.subdomain);
                if (customization) {
                    this.subdomain = customization.websiteTitle;
                }
                if (customization.themeColor) {
                    this.setThemeColor(customization.themeColor);
                }
                else {
                    this.setThemeColor('#027359');
                }

                if (customization.about) {
                    this.about = customization.about;
                }
                else {
                    this.about = "Welcome to " + this.subdomain;
                }
            } catch (error) {
                console.error('Error fetching customization data:', error);
            }
        }
    }

    setThemeColor(themeColor: string) {
        this.renderer.setStyle(this.document.documentElement, '--primary-color', themeColor);

        // Add direct DOM manipulation to cross-check
        this.document.documentElement.style.setProperty('--primary-color', themeColor);

        setTimeout(() => {
            const computedStyle = getComputedStyle(this.document.documentElement);
        }, 1000);
    }
}
