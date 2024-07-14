import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { QuizService } from '../quiz.service';

@Component({
    selector: 'app-basic-quiz',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MatButtonModule,
        MatCardModule,
    ],
    templateUrl: './basic-quiz.component.html',
    styleUrls: ['./basic-quiz.component.scss'],
})
export class BasicQuizComponent implements OnInit {
    questions: any[] = [];
    currentQuestionIndex = 0;
    userAnswers: any[] = [];

    constructor(private quizService: QuizService) { }

    ngOnInit(): void {
        this.loadQuestions();
    }

    loadQuestions(): void {
        this.quizService.getQuestions().subscribe((questions) => {
            this.questions = questions;
        });
    }

    submitAnswer(answer: any): void {
        this.userAnswers[this.currentQuestionIndex] = answer;
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
        } else {
            this.submitQuiz();
        }
    }

    submitQuiz(): void {
        this.quizService.submitQuiz(this.userAnswers).subscribe((result) => {
            console.log('Quiz submitted successfully', result);
        });
    }
}
