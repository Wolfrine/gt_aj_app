import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QuizService } from '../quiz.service';
import { SyllabusService } from '../../../manage-syllabus/syllabus.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

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
export class ManageQuizDatabankComponent implements OnInit {
    questionForm: FormGroup;
    boards: string[] = [];
    standards: string[] = [];
    subjects: string[] = [];
    chapters: string[] = [];

    constructor(
        private fb: FormBuilder,
        private quizService: QuizService,
        private syllabusService: SyllabusService
    ) {
        this.questionForm = this.fb.group({
            board: ['', Validators.required],
            standard: ['', Validators.required],
            subject: ['', Validators.required],
            chapter: ['', Validators.required],
            question: ['', Validators.required],
            option1: ['', Validators.required],
            option2: ['', Validators.required],
            option3: ['', Validators.required],
            option4: ['', Validators.required],
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
        if (this.questionForm.value.board) {
            this.syllabusService.getStandardsByBoard(this.questionForm.value.board).subscribe((standards) => {
                this.standards = standards;
            });
        }
    }

    loadSubjects(): void {
        if (this.questionForm.value.board && this.questionForm.value.standard) {
            const standardId = `${this.questionForm.value.standard}_${this.questionForm.value.board}`;
            this.syllabusService.getSubjectsByStandardAndBoard(standardId, this.questionForm.value.board).subscribe((subjects) => {
                this.subjects = subjects;
            });
        }
    }

    loadChapters(): void {
        if (this.questionForm.value.board && this.questionForm.value.standard && this.questionForm.value.subject) {
            const subjectId = `${this.questionForm.value.subject}_${this.questionForm.value.standard}_${this.questionForm.value.board}`;
            this.syllabusService.getChaptersByStandardBoardAndSubject(this.questionForm.value.standard, this.questionForm.value.board, subjectId).subscribe((chapters) => {
                this.chapters = chapters.map(chapter => chapter.name);
            });
        }
    }


    addQuestion(): void {
        const boardId = this.questionForm.value.board;
        const standardId = `${this.questionForm.value.standard}_${boardId}`;
        const subjectId = `${this.questionForm.value.subject}_${standardId}`;
        const chapterId = `chapter_${this.questionForm.value.chapter}_${subjectId}`;

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
        };

        this.quizService.addQuestion(newQuestion).subscribe(() => {
            this.questionForm.reset();
        });
    }

}
