import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService } from '../../quiz.service';
import { Subscription } from 'rxjs';
import { CustomizationService } from '../../../../customization.service';
import { CommonModule } from '@angular/common';
import { QuizTimerComponent } from '../../../../common/components/quiz-timer/quiz-timer.component';
import { MatCardModule } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { AuthService } from '../../../../common/auth/auth.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-participant-dashboard',
    standalone: true,
    templateUrl: './participant-dashboard.component.html',
    styleUrls: ['./participant-dashboard.component.scss'],
    imports: [CommonModule, QuizTimerComponent, MatCardModule, MatDivider, MatButtonModule]
})
export class ParticipantDashboardComponent implements OnInit, OnDestroy {
    quizId: string | null = null;
    quizDetails: any;
    quizOwner: string | null = null;
    currentQuestion: any = null;
    participantTimer: number = 10;
    message: string = 'The quiz will begin shortly.';
    waitingForNextQuestion: boolean = false;
    quizSessionId: string | null = null; // Updated to be a string based on quiz date and time
    questionStartTime: number = 0; // Timestamp when the question was displayed
    answerSubmitted: boolean = true; // Flag to disable options after submission
    currentUserEmail: string | null = null;
    selectedAnswer = 3;

    private quizSubscription: Subscription | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router, // Router for navigation
        private quizService: QuizService,
        private customizationService: CustomizationService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        // Fetch current user email once at initialization
        this.authService.getCurrentUser().subscribe(user => {
            this.currentUserEmail = user?.email || 'unknown_user';
        });

        // Get quiz ID from query parameters and listen for quiz updates
        this.route.queryParams.subscribe(params => {
            this.quizId = params['quizId'];
            if (this.quizId) {
                this.listenForQuizUpdates();
                this.listenForQuizEnd(); // Listen for quiz end
            }
        });

        // this.currentQuestion = {
        //     question: "Which of the following statements best describes the impact of the Industrial Revolution on global economies during the 18th and 19th centuries?",
        //     options: [
        //         "It led to a significant decrease in global trade as countries focused solely on local economies.",
        //         "It resulted in the widespread replacement of agricultural economies with manufacturing-based economies, increasing urbanization and global trade.",
        //         "It encouraged all nations to adopt a barter system, reducing the reliance on currency and financial institutions.",
        //         "It brought about an immediate improvement in working conditions and wages for all laborers worldwide, reducing social inequality."
        //     ]
        // };
    }

    listenForQuizUpdates(): void {
        if (this.quizId) {
            const instituteId = this.customizationService.getSubdomainFromUrl();
            this.quizSubscription = this.quizService.getQuizById(instituteId, this.quizId).subscribe(quiz => {
                this.quizDetails = quiz;
                this.quizOwner = quiz.quizOwner;

                if (!this.quizSessionId) {
                    this.setQuizSessionId();  // Set the session ID based on quiz date once details are loaded
                }

                if (this.quizOwner && quiz.currentQuestion >= 0) {
                    this.loadCurrentQuestion(quiz.currentQuestion);
                } else {
                    this.displayWaitingMessage('The quiz will begin shortly.');
                }
            });
        }
    }

    listenForQuizEnd(): void {
        // Monitor the endTime field to detect when the quiz ends
        const instituteId = this.customizationService.getSubdomainFromUrl();
        this.quizService.getQuizById(instituteId, this.quizId!).subscribe(quiz => {
            if (quiz.endTime) {
                // Redirect to the report page when endTime is set
                this.router.navigate(['/quiz/live-quiz/report'], {
                    queryParams: {
                        quizId: this.quizId,
                        sessionId: this.quizSessionId
                    }
                });
            }
        });
    }

    setQuizSessionId(): void {
        // Set session ID as a formatted date string if quiz date exists
        if (this.quizDetails?.date) {
            const date = this.quizDetails.date.toDate(); // Assuming `date` is a Firestore Timestamp
            this.quizSessionId = `${date.getFullYear()}${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}${date
                    .getDate()
                    .toString()
                    .padStart(2, '0')}_${date.getHours()}${date
                        .getMinutes()
                        .toString()
                        .padStart(2, '0')}`;
        }
    }

    loadCurrentQuestion(questionIndex: number): void {
        if (questionIndex < this.quizDetails.questions.length) {
            this.currentQuestion = this.quizDetails.questions[questionIndex];
            this.participantTimer = this.quizDetails.timer;
            this.questionStartTime = Date.now(); // Capture timestamp when question is displayed
            this.waitingForNextQuestion = false;
            this.message = '';
            this.answerSubmitted = false; // Reset answer submission flag for new question
            this.selectedAnswer = 0;
        }
    }

    handleAnswerSelection(selectedAnswer: number): void {
        this.selectedAnswer = selectedAnswer; // Assign the selected answer
        if (this.answerSubmitted) return; // Prevent additional submissions

        const timeTaken = Date.now() - this.questionStartTime; // Calculate time in milliseconds        

        console.log('Selected answer:', this.selectedAnswer); // Verify that selection works

        // Prepare answer data for submission
        const answerData = {
            questionID: this.currentQuestion?.id || 'unknown_question',
            selectedAnswer: selectedAnswer,
            correctAnswer: this.currentQuestion?.correctOption || 'unknown',
            timeTaken: timeTaken,
            submittedOn: new Date().toISOString(),
            userId: this.currentUserEmail // Include user email as ID
        };

        // Submit answer data to Firestore using session ID
        this.quizService.submitAnswer(this.quizId!, this.quizSessionId!, answerData).subscribe(() => {
            console.log('Answer submitted:', answerData);
            this.answerSubmitted = true; // Disable options after submission
        });
    }


    handleTimerEnd(): void {
        this.waitingForNextQuestion = true;
        this.displayWaitingMessage('Waiting for the next question to be asked...');
    }

    displayWaitingMessage(msg: string): void {
        this.message = msg;
        this.currentQuestion = null;
    }

    ngOnDestroy(): void {
        this.quizSubscription?.unsubscribe();
    }
}
