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

    actionlist = [
        { "title": "Manage Syllabus", "imageUrl": "./assets/manage-syllabus.png", "route": "/manage-syllabus", "access": "admin" },
        { "title": "Manage Users", "imageUrl": "./assets/manage-users.webp", "route": "/manage-users", "access": "admin" },
        { "title": "Take Quiz", "imageUrl": "./assets/manage-users.webp", "route": "/quiz/basic-quiz", "access": "admin" },
        { "title": "Manage Questionbank", "imageUrl": "./assets/manage-users.webp", "route": "/quiz/view-quiz-databank", "access": "admin" },
        { "title": "Add news", "imageUrl": "./assets/manage-syllabus.png", "route": "/add-news" },
    ];

    constructor(
        public authService: AuthService,
    ) {
        this.user$ = this.authService.user$;
    }

    ngOnInit() {
    }
}
