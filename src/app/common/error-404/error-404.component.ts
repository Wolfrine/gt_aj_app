import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-error-404',
    standalone: true,
    imports: [MatButtonModule, RouterModule],
    templateUrl: './error-404.component.html',
    styleUrl: './error-404.component.scss'
})
export class Error404Component {
    constructor(public router: Router, private _location: Location) { }

    backClicked() {
        this._location.back();
    }
}
