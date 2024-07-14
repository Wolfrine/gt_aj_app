import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../common/auth/auth.service';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';
import { NewsEventsComponent } from '../news-events/news-events.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, NewsEventsComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

    user$!: Observable<User | null>;

    constructor(
        public authService: AuthService,
    ) {
        this.user$ = this.authService.getCurrentUser();
    }

    actionlist = [
        { "title": "Manage Syllabus", "imageUrl": "./assets/manage-syllabus.png", "route": "/manage-syllabus" },
        { "title": "Manage Users", "imageUrl": "./assets/manage-users.webp", "route": "/manage-users" },
        { "title": "Take Quiz", "imageUrl": "./assets/manage-users.webp", "route": "/quiz/basic-quiz" }
    ];

    ngOnInit() {

    }

}
