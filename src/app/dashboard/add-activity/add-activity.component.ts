import { Component, OnInit } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SyllabusService } from '../../manage-syllabus/syllabus.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, doc, setDoc, collection, collectionData, query, where, orderBy, limit } from '@angular/fire/firestore';
import { Observable, take } from 'rxjs';
import { CustomizationService } from '../../customization.service'; // For getting subdomain from the URL
import { AuthService } from '../../common/auth/auth.service';
import { Logger } from '../../logger.service'; // Import Logger

@Component({
    selector: 'app-add-activity',
    standalone: true,
    templateUrl: './add-activity.component.html',
    styleUrls: ['./add-activity.component.scss'],
    imports: [
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        FormsModule,
        ReactiveFormsModule,
        CommonModule
    ]
})
export class AddActivityComponent implements OnInit {
    currentDate: Date = new Date();
    activityForm: FormGroup;
    boards: { id: string, name: string }[] = [];
    standards: { id: string, name: string }[] = [];
    subjects: { id: string, name: string }[] = [];
    currentUserEmail: string | null = null;

    selectedBoard: string = '';
    selectedStandard: string = '';
    selectedSubject: string = '';

    activities: any[] = [];
    students: any[] | undefined;
    currentUserRole: string | undefined;

    constructor(
        private fb: FormBuilder,
        private firestore: Firestore,
        private syllabusService: SyllabusService,
        private customizationService: CustomizationService,
        private authService: AuthService,
        private logger: Logger  // Inject Logger
    ) {
        this.activityForm = this.fb.group({
            board: ['', Validators.required],
            standard: ['', Validators.required],
            subject: ['', Validators.required],
            activityType: ['', Validators.required],
            remarks: [''],
            selectedStudent: [''] // Add the selectedStudent control here
        });
    }

    ngOnInit(): void {
        this.syllabusService.getDistinctBoards().subscribe((boards) => {
            this.boards = boards;
        });

        this.activityForm.get('board')?.valueChanges.subscribe((boardId) => {
            this.selectedBoard = boardId;
            this.syllabusService.getStandardsByBoard(boardId).subscribe((standards) => {
                this.standards = standards;
            });
            this.subjects = []; // Clear subjects when board changes
        });

        this.activityForm.get('standard')?.valueChanges.subscribe((standardId) => {
            this.selectedStandard = standardId;
            this.syllabusService.getSubjectsByStandardAndBoard(standardId).subscribe((subjects) => {
                this.subjects = subjects;
            });
        });

        // Fetch the current user's email
        this.authService.getCurrentUser().subscribe((user) => {
            if (user && user.email) {
                this.currentUserEmail = user.email;

                if (user.role === 'admin' && !this.students) {
                    this.currentUserRole = user.role;
                    const subdomain = this.customizationService.getSubdomainFromUrl();
                    this.authService.getStudents(subdomain).pipe(take(1)).subscribe((students) => {
                        this.students = students;
                    });
                }

                // Fetch user activities
                this.getUserActivities().subscribe((activities) => {
                    this.activities = activities.map(activity => {
                        if (activity.created_at && activity.created_at.toDate) {
                            activity.created_at = activity.created_at.toDate(); // Convert Firestore Timestamp to JS Date
                        }
                        return activity;
                    });
                });
            }
        });
    }

    async onSubmit() {
        let activityCreatorEmail = this.currentUserEmail;

        if (this.currentUserRole === 'admin') {
            activityCreatorEmail = this.activityForm.get('selectedStudent')?.value;
        }

        if (this.activityForm.valid && activityCreatorEmail) {
            const subdomain = this.customizationService.getSubdomainFromUrl();
            const activityData = this.activityForm.getRawValue();

            const instituteDocRef = doc(this.firestore, `institutes/${subdomain}`);
            const activityCollection = collection(instituteDocRef, `activity_list`);
            const activityDocRef = doc(activityCollection);

            await setDoc(activityDocRef, {
                ...activityData,
                created_by: activityCreatorEmail,
                created_at: new Date()
            });

            // Log Firestore Write Operation
            this.logger.addLog({
                type: 'WRITE',
                module: 'AddActivityComponent',
                method: 'onSubmit',
                collection: `institutes/${subdomain}/activity_list`,
                dataSize: JSON.stringify(activityData).length,
                timestamp: new Date().toISOString(),
            });

            this.getUserActivities().subscribe((activities) => {
                this.activities = activities.map(activity => {
                    if (activity.created_at && activity.created_at.toDate) {
                        activity.created_at = activity.created_at.toDate();
                    }
                    return activity;
                });
            });
        } else {
            console.error('User not logged in or form is invalid');
        }
    }

    formatDate(date: Date): string {
        const day = ('0' + date.getDate()).slice(-2);
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const year = date.getFullYear();
        return `${day}${month}${year}`;
    }

    getUserActivities(userEmail?: string, dateStr?: string): Observable<any[]> {
        const subdomain = this.customizationService.getSubdomainFromUrl();

        return new Observable<any[]>(observer => {
            if (userEmail) {
                this.fetchActivities(subdomain, observer, userEmail, dateStr);
            } else {
                this.authService.getCurrentUser().subscribe(user => {
                    if (user && user.email && user.role !== 'admin') {
                        this.fetchActivities(subdomain, observer, user.email, dateStr);
                    } else {
                        this.fetchActivities(subdomain, observer, undefined, dateStr);
                    }
                });
            }
        });
    }

    private fetchActivities(subdomain: string, observer: any, userEmail?: string, dateStr?: string): void {
        let activitiesCollection = collection(this.firestore, `institutes/${subdomain}/activity_list`);
        let activitiesQuery;

        if (dateStr && userEmail) {
            console.log('Filtering by user and date');
            const startOfDay = new Date(dateStr);
            const endOfDay = new Date(startOfDay);
            endOfDay.setHours(23, 59, 59, 999);

            activitiesQuery = query(
                activitiesCollection,
                where('created_by', '==', userEmail),
                where('created_at', '>=', startOfDay),
                where('created_at', '<=', endOfDay),
                orderBy('created_at', 'desc')
            );
        } else if (dateStr) {
            console.log('Filtering by date only');
            const startOfDay = new Date(dateStr);
            const endOfDay = new Date(startOfDay);
            endOfDay.setHours(23, 59, 59, 999);

            activitiesQuery = query(
                activitiesCollection,
                where('created_at', '>=', startOfDay),
                where('created_at', '<=', endOfDay),
                orderBy('created_at', 'desc')
            );
        } else if (userEmail) {
            console.log('Filtering by user only');
            activitiesQuery = query(
                activitiesCollection,
                where('created_by', '==', userEmail),
                orderBy('created_at', 'desc'),
                limit(50)
            );
        } else {
            console.log('Fetching last 50 activities for all users');
            activitiesQuery = query(
                activitiesCollection,
                orderBy('created_at', 'desc'),
                limit(50)
            );
        }

        collectionData(activitiesQuery).subscribe({
            next: (activities) => {
                console.log('Activities fetched:', activities);
                observer.next(activities);
            },
            error: (error) => {
                console.error('Error fetching activities:', error);
                observer.error(error);
            },
            complete: () => {
                console.log('Activity fetching complete');
                observer.complete();
            }
        });
    }
}
