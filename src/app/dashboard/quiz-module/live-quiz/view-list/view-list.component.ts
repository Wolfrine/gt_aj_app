import { Component } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { QuizService } from '../../quiz.service';
import { CustomizationService } from '../../../../customization.service';
import { AuthService } from '../../../../common/auth/auth.service';
import { forkJoin, map, Observable, switchMap } from 'rxjs';
import { SyllabusService } from '../../../../manage-syllabus/syllabus.service';
import { OrdinalPipe } from '../../../../common/custom/ordinal.pipe';
import { Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';


@Component({
    selector: 'app-view-quiz',
    templateUrl: './view-list.component.html',
    styleUrls: ['./view-list.component.scss'],
    standalone: true,
    imports: [
        MatSlideToggleModule,
        MatListModule,
        CommonModule,
        MatCardModule,
        MatChipsModule,
        MatDividerModule,
        MatButtonModule,
        OrdinalPipe,
        MatIconModule,
        RouterModule
    ],
})
export class ViewQuizComponent {
    viewOlderQuizzes: boolean = false;

    // Store for upcoming and older quizzes
    upcomingQuizzes: any[] = [];
    olderQuizzes: any[] = [];
    currentUserEmail: string = '';

    constructor(
        private quizService: QuizService,
        private customizationService: CustomizationService,
        public authService: AuthService,
        private syllabusService: SyllabusService,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Load syllabus first, then load quizzes dynamically
        this.syllabusService.ensureSyllabusLoaded().subscribe(() => {
            this.loadQuizzes();
        });

        this.authService.getCurrentUser().subscribe(user => {
            this.currentUserEmail = user?.email || '';
        });
    }

    // Fetch quizzes and map them to display the correct names
    loadQuizzes(): void {
        this.quizService.getAllLiveQuizzes(this.customizationService.getSubdomainFromUrl()).pipe(
            switchMap(quizzes =>
                forkJoin(
                    quizzes.map(quiz =>
                        forkJoin({
                            board: this.getBoardName(quiz.board),
                            standard: this.getStandardName(quiz.standard),
                            subject: this.getSubjectName(quiz.subject),
                            chapters: this.getChapterNames(quiz.chapters)
                        }).pipe(
                            map(mappedData => ({
                                ...quiz,
                                board: mappedData.board,
                                standard: mappedData.standard,
                                subject: mappedData.subject,
                                chapters: mappedData.chapters,
                                date: quiz.date.toDate()  // Convert Firestore Timestamp to JavaScript Date
                            }))
                        )
                    )
                )
            )
        ).subscribe(quizzes => {
            this.upcomingQuizzes = quizzes.filter(quiz => quiz.status === 'live' || quiz.status === 'upcoming');
            this.olderQuizzes = quizzes.filter(quiz => quiz.status === 'completed' || quiz.status === 'unknown');
        });
    }

    registerForQuiz(quizId: string): void {
        // Fetch current user's email for registration
        if (!this.currentUserEmail) return;

        this.quizService.addParticipant(this.customizationService.getSubdomainFromUrl(), quizId, this.currentUserEmail)
            .subscribe(() => {
                console.log(`Registered ${this.currentUserEmail} for quiz ${quizId}`);
                this.loadQuizzes();  // Reload quizzes to reflect updated registration
            });
    }

    // Map Board ID to Board Name
    getBoardName(boardId: string): Observable<string> {
        return this.syllabusService.getDistinctBoards().pipe(
            map(boards => boards.find(board => board.id === boardId)?.name || 'Unknown Board')
        );
    }

    // Map Standard ID to Standard Name
    getStandardName(standardId: string): Observable<string> {
        return this.syllabusService.getAllStandards().pipe(
            map(standards => standards.find(standard => standard.id === standardId)?.name || 'Unknown Standard')
        );
    }

    // Map Subject ID to Subject Name
    getSubjectName(subjectId: string): Observable<string> {
        return this.syllabusService.getAllStandards().pipe(
            map(standards => {
                const subject = standards.flatMap(standard => standard.children || [])
                    .find(subject => subject.id === subjectId);
                return subject?.name || 'Unknown Subject';
            })
        );
    }

    // Map Chapter IDs to Chapter Names
    getChapterNames(chapterIds: string[]): Observable<string[]> {
        return this.syllabusService.getAllStandards().pipe(
            map(standards => {
                const chapters = standards.flatMap(standard =>
                    standard.children?.flatMap(subject => subject.children || []) || []
                );
                return chapterIds.map(chapterId => {
                    const chapter = chapters.find(chapter => chapter.id === chapterId);
                    return chapter?.name || 'Unknown Chapter';
                });
            })
        );
    }

    startQuiz(quizId: string): void {
        // Calculate the new date to be 5 minutes from now
        const newStartDate = new Date(Date.now() + 5 * 60 * 1000); // Adds 5 minutes

        // Update the quiz with the new start date, resetting current question and clearing end time
        const updatedData = {
            currentQuestion: 0,
            endTime: null,
            date: newStartDate  // Set new start time
        };

        this.quizService.updateQuiz(this.customizationService.getSubdomainFromUrl(), quizId, updatedData)
            .subscribe(() => {
                console.log('Quiz start time updated to 5 minutes from now');
                this.router.navigate(['/quiz/live-quiz/admin-dashboard'], { queryParams: { quizId: quizId } });
            });
    }

    endQuiz(quizId: string): void {
        // Mark the quiz as ended by setting the end time to the current time
        this.quizService.updateQuiz(this.customizationService.getSubdomainFromUrl(), quizId, { endTime: new Date() })
            .subscribe(() => {
                console.log('Quiz ended manually');
            });
    }

    // Toggle for viewing older quizzes
    toggleOlderQuizzes(showOlder: boolean): void {
        this.viewOlderQuizzes = showOlder;
    }

    // Placeholder for editing a quiz
    editQuiz(quizId: string): void {
        console.log(`Editing quiz ID: ${quizId}`);
    }

    // Placeholder for deleting a quiz
    deleteQuiz(quizId: string): void {
        console.log(`Deleting quiz ID: ${quizId}`);
    }

    // Update viewQuizDetails to navigate to the Admin Dashboard with quizId as a parameter
    viewQuizDetails(quizId: string): void {
        this.router.navigate(['/quiz/live-quiz/admin-dashboard'], { queryParams: { quizId: quizId } });
    }

    joinQuiz(quizId: string): void {
        this.router.navigate(['/quiz/live-quiz/participant-dashboard'], { queryParams: { quizId: quizId } });
    }
}
