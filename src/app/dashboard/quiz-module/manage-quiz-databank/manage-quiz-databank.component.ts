import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { QuizService } from '../quiz.service';
import { SyllabusService } from '../../../manage-syllabus/syllabus.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { QuizModuleComponent } from '../quiz-module.component';

@Component({
    selector: 'app-manage-quiz-databank',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatInputModule,
        MatSelectModule,
    ],
    templateUrl: './manage-quiz-databank.component.html',
    styleUrls: ['./manage-quiz-databank.component.scss'],
})
export class ManageQuizDatabankComponent extends QuizModuleComponent implements OnInit {

    constructor(
        fb: FormBuilder,
        quizService: QuizService,
        syllabusService: SyllabusService
    ) {
        super(fb, quizService, syllabusService);
    }

    ngOnInit(): void {
        this.loadBoards(); // Call loadBoards directly
    }

    addQuestion(): void {
        const boardId = this.questionForm.value.board;
        const standardId = this.questionForm.value.standard;
        const subjectId = this.questionForm.value.subject;
        const chapterId = this.questionForm.value.chapter;

        const newQuestion = {
            boardId: boardId,
            standardId: standardId,
            subjectId: subjectId,
            chapterId: chapterId,
            question: this.questionForm.value.question,
            options: [
                this.questionForm.value.option1,
                this.questionForm.value.option2,
                this.questionForm.value.option3,
                this.questionForm.value.option4,
            ],
            correctOption: this.questionForm.value.correctOption,
        };

        this.quizService.addQuestion(newQuestion).subscribe(() => {
            this.questionForm.reset();
        });
    }
}
