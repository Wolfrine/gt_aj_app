import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QuizService } from '../../quiz.service';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CustomizationService } from '../../../../customization.service';
import { MatCardModule } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { Timestamp } from 'firebase/firestore';

@Component({
    selector: 'app-report',
    standalone: true,
    imports: [
        MatCardModule,
        MatDivider,
        CommonModule
    ],
    templateUrl: './report.component.html',
    styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
    quizId: string | null = null;
    sessionId: string | null = null;
    quizDetails: any = null;
    participants: string[] = [];
    questionsWithResponses: any[] = [];
    leaderboard: any[] = [];

    constructor(
        private route: ActivatedRoute,
        private quizService: QuizService,
        private customizationService: CustomizationService
    ) { }

    ngOnInit(): void {
        // Fetch route parameters for quizId and sessionId
        this.route.queryParams.subscribe(params => {
            this.quizId = params['quizId'];
            this.sessionId = params['sessionId'];

            if (this.quizId) {
                this.checkAndFetchReportData();
            }
        });
    }

    checkAndFetchReportData(): void {
        if (this.sessionId) {
            this.fetchQuizDetailsAndResponses();
        } else {
            this.fetchLatestSessionId();
        }
    }

    fetchLatestSessionId(): void {
        if (!this.quizId) return;

        this.quizService.getLatestSessionId(this.quizId).subscribe(latestSessionId => {
            if (latestSessionId) {
                this.sessionId = latestSessionId;
                this.fetchQuizDetailsAndResponses();
            } else {
                console.error('No session data available for this quiz.');
            }
        });
    }

    fetchQuizDetailsAndResponses(): void {
        if (!this.quizId || !this.sessionId) return;

        const instituteId = this.customizationService.getSubdomainFromUrl();

        // Fetch quiz details and responses for the session
        this.quizService.getQuizById(instituteId, this.quizId).pipe(
            switchMap(quiz => {
                // Convert any Firestore Timestamps to JavaScript Date objects
                this.quizDetails = {
                    ...quiz,
                    date: quiz.date instanceof Timestamp ? quiz.date.toDate() : quiz.date,
                    endTime: quiz.endTime instanceof Timestamp ? quiz.endTime.toDate() : quiz.endTime
                };

                this.participants = quiz.participants || [];
                return this.quizService.getSessionResponses(this.quizId!, this.sessionId!);
            })
        ).subscribe(responses => {
            this.processResponses(responses);
            this.calculateLeaderboard();
        });
    }


    processResponses(responses: any): void {
        // Ensure questions follow the `questionIds` order
        this.questionsWithResponses = this.quizDetails.questionIds.map((questionId: string) => {
            const question = this.quizDetails.questions.find((q: any) => q.id === questionId);

            // Map responses for each question and mark correctness
            return {
                ...question,
                responses: (responses[questionId] || []).map((response: any) => ({
                    ...response,
                    isCorrect: response.selectedAnswer === response.correctAnswer
                }))
            };
        });
    }


    calculateLeaderboard(): void {
        const participantScores: { [userId: string]: { correct: number; totalTime: number } } = {};
        const questionTimerMs = this.quizDetails.timer * 1000; // Timer in milliseconds for internal calculations

        this.questionsWithResponses.forEach(question => {
            question.responses.forEach((response: any) => {
                const userId = response.userId;
                const isCorrect = response.isCorrect;
                const timeTaken = response.timeTaken;

                if (!participantScores[userId]) {
                    participantScores[userId] = { correct: 0, totalTime: 0 };
                }

                if (isCorrect) {
                    participantScores[userId].correct++;
                }
                participantScores[userId].totalTime += timeTaken; // Still in milliseconds
            });

            // Add full timer for unanswered questions
            const answeredUserIds = question.responses.map((response: any) => response.userId);
            this.participants.forEach((userId: string) => {
                if (!answeredUserIds.includes(userId)) {
                    if (!participantScores[userId]) {
                        participantScores[userId] = { correct: 0, totalTime: 0 };
                    }
                    participantScores[userId].totalTime += questionTimerMs; // Add timer in ms
                }
            });
        });

        // Convert totalTime to seconds for display and sort leaderboard
        this.leaderboard = Object.keys(participantScores).map(userId => ({
            userId,
            correct: participantScores[userId].correct,
            totalTime: Math.round(participantScores[userId].totalTime / 1000) // Convert ms to seconds for display
        })).sort((a, b) => b.correct - a.correct || a.totalTime - b.totalTime).slice(0, 5);
    }



}
