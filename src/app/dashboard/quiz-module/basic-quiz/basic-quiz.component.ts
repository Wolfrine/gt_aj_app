import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { QuizService } from '../quiz.service';
import { SyllabusService } from '../../../manage-syllabus/syllabus.service';
import { BaseComponent } from '../quiz-base.component';

@Component({
    selector: 'app-basic-quiz',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatButtonModule,
        MatCardModule,
        MatSelectModule,
    ],
    templateUrl: './basic-quiz.component.html',
    styleUrls: ['./basic-quiz.component.scss'],
})
export class BasicQuizComponent extends BaseComponent implements OnInit {
    currentQuestionIndex = 0;
    userAnswers: any[] = [];

    constructor(
        fb: FormBuilder,
        quizService: QuizService,
        syllabusService: SyllabusService
    ) {
        super(fb, quizService, syllabusService);
    }

    ngOnInit(): void {
        this.loadBoards();
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
