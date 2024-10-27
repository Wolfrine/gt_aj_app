import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QuizService } from '../../quiz.service';
import { Subscription } from 'rxjs';
import { CustomizationService } from '../../../../customization.service';
import { CommonModule } from '@angular/common';
import { QuizTimerComponent } from '../../../../common/components/quiz-timer/quiz-timer.component';
import { MatCardModule } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';

@Component({
    selector: 'app-participant-dashboard',
    standalone: true,
    templateUrl: './participant-dashboard.component.html',
    styleUrls: ['./participant-dashboard.component.scss'],
    imports: [CommonModule, QuizTimerComponent, MatCardModule, MatDivider]
})
export class ParticipantDashboardComponent implements OnInit, OnDestroy {
    quizId: string | null = null;
    quizDetails: any;
    quizOwner: string | null = null;
    currentQuestion: any = null;
    participantTimer: number = 30;
    message: string = 'The quiz will begin shortly.';
    waitingForNextQuestion: boolean = false;

    private quizSubscription: Subscription | null = null;

    constructor(
        private route: ActivatedRoute,
        private quizService: QuizService,
        private customizationService: CustomizationService
    ) { }

    ngOnInit(): void {
        // Get quiz ID from query parameters and listen for quiz updates
        this.route.queryParams.subscribe(params => {
            this.quizId = params['quizId'];
            if (this.quizId) {
                this.listenForQuizUpdates();
            }
        });
    }

    listenForQuizUpdates(): void {
        // Listen to quiz details updates, specifically to quizOwner and current question
        if (this.quizId) {
            const instituteId = this.customizationService.getSubdomainFromUrl();
            this.quizSubscription = this.quizService.getQuizById(instituteId, this.quizId).subscribe(quiz => {
                this.quizDetails = quiz;
                this.quizOwner = quiz.quizOwner;

                if (this.quizOwner && quiz.currentQuestion >= 0) {
                    // Directly fetch the current question from the loaded quiz data
                    this.loadCurrentQuestion(quiz.currentQuestion);
                } else {
                    // Waiting for quiz to begin or quizOwner to be set
                    this.displayWaitingMessage('The quiz will begin shortly.');
                }
            });
        }
    }

    loadCurrentQuestion(questionIndex: number): void {
        if (questionIndex < this.quizDetails.questions.length) {
            this.currentQuestion = this.quizDetails.questions[questionIndex];
            this.participantTimer = this.quizDetails.timer;  // Set timer for quiz question
            this.waitingForNextQuestion = false;
            this.message = '';  // Clear waiting message
        }
    }

    handleTimerEnd(): void {
        // Handle actions when the participant's timer ends
        this.waitingForNextQuestion = true;
        this.displayWaitingMessage('Waiting for the next question to be asked...');
    }

    displayWaitingMessage(msg: string): void {
        this.message = msg;
        this.currentQuestion = null;
    }

    submitAnswer(answer: string): void {
        console.log('Submitted Answer:', answer);
    }

    ngOnDestroy(): void {
        // Clean up subscriptions
        this.quizSubscription?.unsubscribe();
    }
}
