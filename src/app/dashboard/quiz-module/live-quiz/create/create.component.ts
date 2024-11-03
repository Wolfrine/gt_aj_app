import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';  // For question selection
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { SyllabusService } from '../../../../manage-syllabus/syllabus.service';
import { QuizService } from '../../quiz.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ManageQuizDatabankComponent } from '../../manage-quiz-databank/manage-quiz-databank.component';  // Import the component for adding questions

@Component({
    selector: 'app-create-live-quiz',
    templateUrl: './create.component.html',
    styleUrls: ['./create.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        ManageQuizDatabankComponent  // Include the existing question databank component
    ]
})
export class CreateLiveQuizComponent implements OnInit {
    createQuizForm!: FormGroup;
    boards$!: Observable<{ id: string, name: string }[]>;
    standards$!: Observable<{ id: string, name: string }[]>;
    subjects$!: Observable<{ id: string, name: string }[]>;
    chapters$!: Observable<{ id: string, name: string }[]>;
    questions$!: Observable<any[]>;  // Store fetched questions
    selectedQuestions: string[] = [];  // Store selected question IDs

    constructor(
        private fb: FormBuilder,
        private syllabusService: SyllabusService,
        private quizService: QuizService
    ) { }

    ngOnInit(): void {
        this.createQuizForm = this.fb.group({
            board: ['', Validators.required],
            standard: ['', Validators.required],
            subject: ['', Validators.required],
            chapters: [[], Validators.required],
            date: ['', Validators.required],
            time: ['', Validators.required],
            timer: [30, [Validators.required, Validators.min(5)]]
        });

        this.boards$ = this.syllabusService.getDistinctBoards();
        this.createQuizForm.get('board')?.valueChanges.subscribe((boardId) => {
            this.standards$ = this.syllabusService.getStandardsByBoard(boardId);
        });
        this.createQuizForm.get('standard')?.valueChanges.subscribe((standardId) => {
            this.subjects$ = this.syllabusService.getSubjectsByStandardAndBoard(standardId);
        });
        this.createQuizForm.get('subject')?.valueChanges.subscribe((subjectId) => {
            this.chapters$ = this.syllabusService.getChaptersByStandardBoardAndSubject(subjectId);
        });

        // Fetch questions once chapter is selected
        this.createQuizForm.get('chapters')?.valueChanges.subscribe((chapterIds) => {
            console.log('Selected chapters:', chapterIds);  // Check selected chapters
            this.questions$ = this.quizService.getQuestionsByChapter(chapterIds);

            // Check if questions are being fetched correctly
            this.questions$.subscribe(questions => {
                console.log('Fetched questions:', questions);  // Debugging output
            });
        });
    }

    // Handle selection of questions (add/remove question ID from selectedQuestions array)
    toggleQuestionSelection(questionId: string, event: any): void {
        if (event.checked) {
            if (questionId) {
                this.selectedQuestions.push(questionId);  // Only add if the question ID is valid
            } else {
                console.error('Question ID is undefined');
            }
        } else {
            this.selectedQuestions = this.selectedQuestions.filter(id => id !== questionId);
        }

        console.log('Selected Questions:', this.selectedQuestions);  // Debugging output
    }

    // Handle form submission and save the quiz
    submitQuiz(): void {
        if (this.createQuizForm.valid && this.selectedQuestions.length > 0) {
            const filteredQuestionIds = this.selectedQuestions.filter(id => id !== undefined);

            const quizData = {
                ...this.createQuizForm.value,
                questionIds: filteredQuestionIds  // Add only valid question IDs
            };

            console.log('Quiz data to be submitted:', quizData);  // Debugging output

            this.quizService.createLiveQuiz(quizData).subscribe({
                next: (docRef) => {
                    if (docRef) {  // Check if docRef is not null
                        alert(`Quiz created successfully! Quiz ID: ${docRef.id}`);
                        this.createQuizForm.reset();
                        this.selectedQuestions = [];  // Reset the selected questions
                    } else {
                        console.error('Quiz creation returned null DocumentReference');
                    }
                },
                error: (err) => {
                    console.error('Error creating quiz:', err);
                }
            });
        } else {
            alert('Please fill all required fields and select at least one valid question.');
        }
    }
}
