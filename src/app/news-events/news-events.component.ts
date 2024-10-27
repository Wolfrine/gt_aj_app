import { Component, OnInit } from '@angular/core';
import { NewsService } from './news-events.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { RouterModule, Router } from '@angular/router';

import { CustomizationService } from '../customization.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-news-events',
    standalone: true,
    templateUrl: './news-events.component.html',
    styleUrls: ['./news-events.component.scss'],
    imports: [
        CommonModule,
        MatCardModule,
        MatDividerModule,
        MatRippleModule,
        RouterModule // Import RouterModule here
    ],
})
export class NewsEventsComponent implements OnInit {
    newsList: any[] = [];
    lastVisibleDoc: any = null;
    instituteId = typeof window !== 'undefined' ? this.customizationService.getSubdomainFromUrl() : 'Test 32'; // Ensure this matches your actual institute ID
    sanitizedContent: SafeHtml | undefined;

    constructor(
        private newsService: NewsService,
        private customizationService: CustomizationService,
        private router: Router,
        private sanitizer: DomSanitizer
    ) { }

    async ngOnInit() {
        if (typeof window !== 'undefined') {
            this.loadNews();
        }
    }

    loadNews() {
        this.newsService.getNews(this.instituteId).subscribe(news => {
            if (news.length > 0) {
                this.lastVisibleDoc = news[news.length - 1];
            }
            this.newsList = news;
            // console.log('News list updated:', this.newsList);
        });
    }

    loadMoreNews() {
        if (this.lastVisibleDoc) {
            this.newsService.getMoreNews(this.instituteId, this.lastVisibleDoc).then(news => {
                // console.log('Fetched more news:', news);
                if (news.length > 0) {
                    this.lastVisibleDoc = news[news.length - 1];
                    this.newsList = [...this.newsList, ...news];
                }
            });
        }
    }

    onScroll() {
        this.loadMoreNews();
    }

    getTruncatedContent(content: string): string {
        const maxLength = 105; // set your character limit here
        if (content.length > maxLength) {
            return content.substring(0, maxLength) + '...';
        }
        return content;
    }

    encodeTitle(title: string): string {
        return title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }

    viewArticle(title: string, id: string): void {
        const encodedTitle = this.encodeTitle(title) + '-' + id;
        this.router.navigate(['/view-news', encodedTitle]);
    }

    sanitizeContent(content: string): SafeHtml {
        // Remove font styles using a regex or DOM manipulation if needed
        const strippedContent = content.replace(/<style[\s\S]*?<\/style>/gi, '');
        return this.sanitizer.bypassSecurityTrustHtml(strippedContent);
    }
}
