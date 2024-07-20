import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { QuizService } from '../quiz.service';
import { SyllabusService } from '../../../manage-syllabus/syllabus.service';

@Component({
    selector: 'app-basic-quiz',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        MatButtonModule,
        MatCardModule,
        MatSelectModule,
    ],
    templateUrl: './basic-quiz.component.html',
    styleUrls: ['./basic-quiz.component.scss'],
})
export class BasicQuizComponent implements OnInit {
    questions: any[] = [];
    currentQuestionIndex = 0;
    userAnswers: any[] = [];
    quizForm: FormGroup;
    boards: string[] = [];
    standards: string[] = [];
    subjects: string[] = [];
    chapters: string[] = [];

    constructor(
        private quizService: QuizService,
        private syllabusService: SyllabusService,
        private fb: FormBuilder
    ) {
        this.quizForm = this.fb.group({
            board: ['', Validators.required],
            standard: ['', Validators.required],
            subject: ['', Validators.required],
            chapter: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        this.loadBoards();
    }

    loadBoards(): void {
        this.syllabusService.getDistinctBoards().subscribe((boards) => {
            this.boards = boards;
        });
    }

    loadStandards(): void {
        if (this.quizForm.value.board) {
            this.syllabusService.getStandardsByBoard(this.quizForm.value.board).subscribe((standards) => {
                this.standards = standards;
            });
        }
    }

    loadSubjects(): void {
        if (this.quizForm.value.board && this.quizForm.value.standard) {
            const standardId = `${this.quizForm.value.standard}_${this.quizForm.value.board}`;
            this.syllabusService.getSubjectsByStandardAndBoard(standardId, this.quizForm.value.board).subscribe((subjects) => {
                this.subjects = subjects;
            });
        }
    }

    loadChapters(): void {
        if (this.quizForm.value.board && this.quizForm.value.standard && this.quizForm.value.subject) {
            const subjectId = `${this.quizForm.value.subject}_${this.quizForm.value.standard}_${this.quizForm.value.board}`;
            this.syllabusService.getChaptersByStandardBoardAndSubject(this.quizForm.value.standard, this.quizForm.value.board, subjectId).subscribe((chapters) => {
                this.chapters = chapters.map(chapter => chapter.name);
            });
        }
    }


    loadQuestions(): void {
        const { board, standard, subject, chapter } = this.quizForm.value;
        this.quizService.getQuestionsByChapter(board, standard, subject, chapter).subscribe((questions) => {
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
