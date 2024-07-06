import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

    actionlist = [
        { "title": "Manage Syllabus", "imageUrl": "./assets/manage-syllabus.png", "route": "/manage-syllabus" },
        { "title": "Manage Users", "imageUrl": "./assets/manage-users.webp", "route": "/manage-users" }
    ];

}
