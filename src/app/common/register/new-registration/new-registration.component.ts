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
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

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
    standards: { id: string, name: string }[] = [];
    boards: { id: string, name: string }[] = [];
    subjects: { id: string, name: string }[] = [];
    firestore = inject(Firestore);

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
            phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],  // Ensure phone is 10 digits
            institute: ['', Validators.required],
            role: ['', Validators.required],
            board: [''],   // Single board selection
            standard: [''],   // Single standard selection
            subjects: [[]],   // Multiple subjects
            childEmail: ['', Validators.email]
        });
    }

    ngOnInit() {
        this.registrationForm.patchValue({ institute: this.customizationService.getSubdomainFromUrl() });

        // Fetch logged-in user's name, email and pre-fill the form with registration details
        this.authService.user$.subscribe(async (user) => {
            if (user) {
                this.registrationForm.patchValue({
                    name: user.displayName,
                    email: user.email
                });

                // Fetch the user's existing registration details from Firestore
                const userDocRef = doc(this.firestore, `institutes/${this.customizationService.getSubdomainFromUrl()}/users/${user.email}`);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const registrationData = userDoc.data();
                    this.registrationForm.patchValue({
                        phone: registrationData['phone'],
                        role: registrationData['role'],
                        board: registrationData['board'],
                        standard: registrationData['standard'],
                        subjects: registrationData['subjects'] || [],
                        childEmail: registrationData['childEmail'] || ''
                    });

                    // Ensure validators are applied based on the role
                    this.setConditionalValidators(registrationData['role']);
                }
            }
        });

        // Fetch boards and standards on initialization
        this.syllabusService.getDistinctBoards().subscribe((boards) => {
            this.boards = boards;
        });

        this.registrationForm.get('board')?.valueChanges.subscribe((boardId) => {
            this.fetchStandards(boardId);
        });

        this.registrationForm.get('standard')?.valueChanges.subscribe((standardId) => {
            this.fetchSubjects(standardId);
        });
    }

    fetchStandards(boardId: string) {
        this.syllabusService.getStandardsByBoard(boardId).subscribe((standards) => {
            this.standards = standards;
            // Reset standard when board changes
            this.registrationForm.patchValue({ standard: '' });
        });
    }

    fetchSubjects(standardId: string) {
        this.syllabusService.getSubjectsByStandardAndBoard(standardId).subscribe((subjects) => {
            this.subjects = subjects;
            // Reset subjects when standard changes
            this.registrationForm.patchValue({ subjects: [] });
        });
    }

    onRoleChange() {
        const role = this.registrationForm.get('role')?.value;

        if (role === 'student') {
            this.registrationForm.patchValue({ standards: [], subjects: [], childEmail: '' });
            this.registrationForm.get('board')?.setValidators(Validators.required);
            this.registrationForm.get('standard')?.setValidators(Validators.required);
        } else if (role === 'teacher') {
            this.registrationForm.patchValue({ boards: [], standards: [], subjects: [], childEmail: '' });
            this.registrationForm.get('boards')?.setValidators(Validators.required);
            this.registrationForm.get('standards')?.setValidators(Validators.required);
            this.registrationForm.get('subjects')?.setValidators(Validators.required);
        } else if (role === 'parent') {
            this.registrationForm.patchValue({ board: '', standard: '', standards: [], subjects: [] });
            this.registrationForm.get('childEmail')?.setValidators([Validators.required, Validators.email]);
        }

        // Update validation and form controls
        this.registrationForm.get('boards')?.updateValueAndValidity();
        this.registrationForm.get('standards')?.updateValueAndValidity();
        this.registrationForm.get('subjects')?.updateValueAndValidity();
        this.registrationForm.get('board')?.updateValueAndValidity();
        this.registrationForm.get('standard')?.updateValueAndValidity();
        this.registrationForm.get('childEmail')?.updateValueAndValidity();
    }

    setConditionalValidators(role: string) {
        const boardControl = this.registrationForm.get('board');
        const standardControl = this.registrationForm.get('standard');
        const subjectsControl = this.registrationForm.get('subjects');
        const childEmailControl = this.registrationForm.get('childEmail');

        boardControl?.clearValidators();
        standardControl?.clearValidators();
        subjectsControl?.clearValidators();
        childEmailControl?.clearValidators();

        if (role === 'student') {
            boardControl?.setValidators(Validators.required);
            standardControl?.setValidators(Validators.required);
        } else if (role === 'teacher') {
            standardControl?.setValidators(Validators.required);
            subjectsControl?.setValidators(Validators.required);
        } else if (role === 'parent') {
            childEmailControl?.setValidators([Validators.required, Validators.email]);
        }

        boardControl?.updateValueAndValidity();
        standardControl?.updateValueAndValidity();
        subjectsControl?.updateValueAndValidity();
        childEmailControl?.updateValueAndValidity();
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
}
