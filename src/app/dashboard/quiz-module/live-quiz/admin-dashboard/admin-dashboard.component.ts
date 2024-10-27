import { Component, OnInit } from '@angular/core';
import { QuizService } from '../../quiz.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { CustomizationService } from '../../../../customization.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizTimerComponent } from '../../../../common/components/quiz-timer/quiz-timer.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../common/auth/auth.service';
import { Timestamp } from '@angular/fire/firestore';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        MatDividerModule,
        MatCardModule,
        CommonModule,
        MatIcon,
        QuizTimerComponent,
    ],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
    quizId: string = '';
    quizDetails: any = {
        board: '',
        standard: '',
        subject: '',
        chapters: [],
        questions: []
    };
    timerValue: number = 10;
    currentQuestionIndex: number = 0;
    totalParticipants = 0;
    isQuizOwner: boolean = false;
    quizStarted: boolean = false;

    constructor(
        private quizService: QuizService,
        private bottomSheet: MatBottomSheet,
        private customizationService: CustomizationService,
        private route: ActivatedRoute,
        private snackBar: MatSnackBar,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.quizId = params['quizId'];
            if (this.quizId) {
                this.loadQuizDetails(this.quizId);
                this.listenToCurrentQuestion(this.quizId);
            }
        });
    }

    loadQuizDetails(quizId: string): void {
        this.quizService.getQuizById(this.customizationService.getSubdomainFromUrl(), quizId).subscribe((quizData: any) => {
            this.quizDetails = quizData;
            this.authService.getCurrentUser().subscribe((currentUser) => {
                if (currentUser) {
                    this.isQuizOwner = this.quizDetails.quizOwner === currentUser.email;
                }
            });
            this.quizStarted = !!this.quizDetails.quizOwner;
            this.currentQuestionIndex = this.quizDetails.currentQuestion || 0;
            this.updateQuestionStatuses();
            this.timerValue = quizData.timer;

            if (this.quizStarted && this.currentQuestionIndex === 0) {
                this.startTimerForCurrentQuestion();
            }
        });
    }

    listenToCurrentQuestion(quizId: string): void {
        this.quizService.listenToCurrentQuestionIndex(quizId).subscribe(index => {
            if (index !== this.currentQuestionIndex) {
                this.currentQuestionIndex = index;
                this.updateQuestionStatuses();
            }
        });
    }

    startQuiz(): void {
        this.authService.getCurrentUser().subscribe((user) => {
            if (user) {
                const updatedData = {
                    quizOwner: user.email,
                    currentQuestion: 0,
                    endTime: null,
                    date: Timestamp.now()  // Set start time as current Firestore timestamp
                };
                this.quizService.updateQuiz(this.customizationService.getSubdomainFromUrl(), this.quizId, updatedData).subscribe(() => {
                    this.isQuizOwner = true;
                    this.quizStarted = true;
                    this.currentQuestionIndex = 0;
                    this.updateQuestionStatuses();
                    this.startTimerForCurrentQuestion();
                });
            }
        });
    }

    endQuiz(): void {
        const updatedData = {
            quizOwner: null,
            currentQuestion: 0,
            endTime: Timestamp.now()  // Firestore's current timestamp for endTime
        };
        this.quizService.updateQuiz(this.customizationService.getSubdomainFromUrl(), this.quizId, updatedData).subscribe(() => {
            this.quizStarted = false;
            this.isQuizOwner = false;
            this.currentQuestionIndex = 0;
            this.updateQuestionStatuses();
        });
    }

    updateQuestionStatuses(): void {
        this.quizDetails.questions = this.quizDetails.questions.map((question: any, index: number) => ({
            ...question,
            status: !this.quizStarted ? 'pending' :
                index === this.currentQuestionIndex ? 'ongoing' :
                    index < this.currentQuestionIndex ? 'completed' : 'pending'
        }));
    }

    onTimerEnded(): void {
        if (this.isQuizOwner && this.currentQuestionIndex < this.quizDetails.questions.length - 1) {
            this.quizService.updateCurrentQuestionIndex(this.quizId, this.currentQuestionIndex + 1).subscribe();
        } else {
            this.endQuiz();
        }
    }

    startTimerForCurrentQuestion(): void {
        this.updateQuestionStatuses();
    }
}
