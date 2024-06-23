import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { RegistrationService } from '../registration.service';
import { NotificationService } from '../../notification/notification.service';
import { AuthService } from '../../auth/auth.service';
import { SyllabusService } from '../../../manage-syllabus/syllabus.service';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { CustomizationService } from '../../../customization.service';

@Component({
    selector: 'app-new-registration',
    templateUrl: './new-registration.component.html',
    styleUrls: ['./new-registration.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatSnackBarModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatRadioModule,
        MatButtonModule
    ]
})
export class NewRegistrationComponent implements OnInit {
    registrationForm: FormGroup;
    standards: any[] = [];
    boards: string[] = [];
    subjects: string[] = [];

    private registrationService = inject(RegistrationService);
    private notificationService = inject(NotificationService);
    private router = inject(Router);
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private syllabusService = inject(SyllabusService);
    private customizationService = inject(CustomizationService);

    constructor() {
        this.registrationForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', Validators.required],
            institute: ['', Validators.required],
            role: ['', Validators.required],
            standard: [''],
            board: [''],
            standards: [[]],
            boards: [[]],
            subjects: [[]],
            childEmail: ['']
        });
    }

    ngOnInit() {

        this.registrationForm.patchValue({ institute: this.customizationService.getSubdomainFromUrl() })

        this.authService.user$.subscribe(async (user) => {
            if (user) {
                this.registrationForm.patchValue({
                    name: user.displayName,
                    email: user.email
                });
            }
        });

        this.syllabusService.getAllStandards().subscribe((standards) => {
            this.standards = standards;
        });

        this.syllabusService.getDistinctBoards().subscribe((boards) => {
            this.boards = boards;
        });

        this.registrationForm.get('standard')?.valueChanges.subscribe((standardId) => {
            const board = this.registrationForm.get('board')?.value;
            if (standardId && board) {
                this.fetchSubjects(standardId, board);
            }
        });

        this.registrationForm.get('board')?.valueChanges.subscribe((board) => {
            const standardId = this.registrationForm.get('standard')?.value;
            if (standardId && board) {
                this.fetchSubjects(standardId, board);
            }
        });

        this.registrationForm.statusChanges.subscribe(status => {
            console.log('Form Status: ', status);
            this.logFormControlsStatus();
        });
    }

    fetchSubjects(standardId: string, boardName: string) {
        this.syllabusService.getSubjectsByStandardAndBoard(standardId, boardName).subscribe((subjects) => {
            this.subjects = subjects;
        });
    }

    setConditionalValidators(role: string) {
        const standardControl = this.registrationForm.get('standard');
        const boardControl = this.registrationForm.get('board');
        const standardsControl = this.registrationForm.get('standards');
        const boardsControl = this.registrationForm.get('boards');
        const subjectsControl = this.registrationForm.get('subjects');

        standardControl?.clearValidators();
        boardControl?.clearValidators();
        standardsControl?.clearValidators();
        boardsControl?.clearValidators();
        subjectsControl?.clearValidators();

        if (role === 'student') {
            standardControl?.setValidators(Validators.required);
            boardControl?.setValidators(Validators.required);
        } else if (role === 'teacher') {
            standardsControl?.setValidators(Validators.required);
            boardsControl?.setValidators(Validators.required);
            subjectsControl?.setValidators(Validators.required);
        }

        standardControl?.updateValueAndValidity();
        boardControl?.updateValueAndValidity();
        standardsControl?.updateValueAndValidity();
        boardsControl?.updateValueAndValidity();
        subjectsControl?.updateValueAndValidity();
    }

    onSubmit() {
        if (this.registrationForm.valid) {
            this.registrationService.register(this.registrationForm.getRawValue()).then(
                () => {
                    this.notificationService.showSuccess('Registration submitted successfully.');
                    this.router.navigate(['/register/submitted']);
                },
                (error) => {
                    this.notificationService.showError('Registration submission failed.');
                    console.error(error);
                }
            );
        }
    }

    private logFormControlsStatus() {
        Object.keys(this.registrationForm.controls).forEach(key => {
            const control = this.registrationForm.get(key);
            console.log(`Control: ${key}, Status: ${control?.status}, Errors: ${control?.errors}`);
        });
    }
}
