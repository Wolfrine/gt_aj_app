import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NewsService } from '../news-events.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CustomizationService } from '../../customization.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
    selector: 'app-view-news',
    templateUrl: './view-news.component.html',
    styleUrls: ['./view-news.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatDividerModule
    ]
})
export class ViewNewsComponent implements OnInit {
    title: string = '';
    newsItem: any;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private newsService: NewsService,
        private customizatonservice: CustomizationService
    ) { }

    ngOnInit(): void {
        const title = this.route.snapshot.paramMap.get('title');
        if (title) {
            console.log('news received' + title);
            this.title = title;
            this.newsService.getNewsEventById(this.customizatonservice.getSubdomainFromUrl(), this.decodeTitle(title)).subscribe(news => {
                if (news) {
                    this.newsItem = news; // Assuming title is unique and we get an array of one item
                }
                else {
                    console.log('invalid news');
                    this.router.navigate(['/news']);
                }

            });
        } else {
            // Handle the case when the title is null, e.g., navigate to a default route
            console.log('invalid news');
            this.router.navigate(['/news']);
        }
    }

    decodeTitle(title: string): string {
        console.log(title.split("-").pop());
        return title.split("-").pop()!;
    }
}
