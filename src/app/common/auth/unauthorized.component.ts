import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-unauthorized',
    standalone: true,
    imports: [RouterModule],
    template: `<h1>Unauthorized</h1><p>You do not have permission to view this page.</p> <a [routerLink]="['/register']">Register here</a>`
})
export class UnauthorizedComponent { }