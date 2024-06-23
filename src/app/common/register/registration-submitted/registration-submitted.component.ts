import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-registration-submitted',
    templateUrl: './registration-submitted.component.html',
    styleUrls: ['./registration-submitted.component.scss'],
    standalone: true,
    imports: [CommonModule, MatButtonModule, RouterModule]
})
export class RegistrationSubmittedComponent { }
