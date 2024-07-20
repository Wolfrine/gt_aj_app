import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QuizService } from './quiz.service';
import { SyllabusService } from '../../manage-syllabus/syllabus.service';

export class BaseComponent {
    questionForm!: FormGroup;
    boards: { id: string, name: string }[] = [];
    standards: { id: string, name: string }[] = [];
    subjects: { id: string, name: string }[] = [];
    chapters: { id: string, name: string }[] = [];
    questions: any[] = [];

    constructor(
        protected fb: FormBuilder,
        protected quizService: QuizService,
        protected syllabusService: SyllabusService
    ) {
        this.initializeForm();
    }

    initializeForm(): void {
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
            correctOption: ['', Validators.required],
        });
    }

    loadBoards(): void {
        this.syllabusService.getDistinctBoards().subscribe((boards) => {
            this.boards = boards;
        });
    }

    loadStandards(): void {
        const boardId = this.questionForm.get('board')?.value;
        if (boardId) {
            this.syllabusService.getStandardsByBoard(boardId).subscribe((standards) => {
                this.standards = standards;
                this.questionForm.get('standard')?.reset();
                this.subjects = [];
                this.chapters = [];
            });
        }
    }

    loadSubjects(): void {
        const standardId = this.questionForm.get('standard')?.value;
        if (standardId) {
            this.syllabusService.getSubjectsByStandardAndBoard(standardId).subscribe((subjects) => {
                this.subjects = subjects;
                this.questionForm.get('subject')?.reset();
                this.chapters = [];
            });
        }
    }

    loadChapters(): void {
        const subjectId = this.questionForm.get('subject')?.value;
        if (subjectId) {
            this.syllabusService.getChaptersByStandardBoardAndSubject(subjectId).subscribe((chapters) => {
                this.chapters = chapters;
                this.questionForm.get('chapter')?.reset();
            });
        }
    }

    loadQuestions(): void {
        const selectedChapterId = this.questionForm.get('chapter')?.value;
        if (selectedChapterId) {
            this.quizService.getQuestionsByChapter(selectedChapterId).subscribe((questions) => {
                this.questions = questions;
            });
        }
    }
}
