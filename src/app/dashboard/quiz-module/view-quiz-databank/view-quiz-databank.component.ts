import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QuizService } from '../quiz.service';
import { SyllabusService } from '../../../manage-syllabus/syllabus.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import * as ExcelJS from 'exceljs';
import { QuizModuleComponent } from '../quiz-module.component';

@Component({
    selector: 'app-view-quiz-databank',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatTableModule,
        MatInputModule,
        MatSelectModule,
    ],
    templateUrl: './view-quiz-databank.component.html',
    styleUrls: ['./view-quiz-databank.component.scss'],
})
export class ViewQuizDatabankComponent extends QuizModuleComponent implements OnInit {
    displayedColumns: string[] = ['question', 'options'];

    constructor(
        private router: Router,
        fb: FormBuilder,
        quizService: QuizService,
        syllabusService: SyllabusService
    ) {
        super(fb, quizService, syllabusService);
    }

    ngOnInit(): void {
        this.initializeForm(); // Initialize the form here
        this.loadBoards();
    }

    override initializeForm(): void {
        this.questionForm = this.fb.group({
            board: ['', Validators.required],
            standard: ['', Validators.required],
            subject: ['', Validators.required],
            chapter: ['', Validators.required]
        });
    }

    onFileChange(event: any): void {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = async (e: any) => {
            const buffer = e.target.result;
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);
            const worksheet = workbook.getWorksheet(1);
            const jsonData: any[] = [];

            if (!worksheet) {
                console.error('Worksheet is undefined');
                return;
            }

            worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                if (rowNumber === 1) {
                    // Skip header row
                    return;
                }
                const rowData: any = {};
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const headerCell = worksheet.getRow(1).getCell(colNumber);
                    const header = headerCell ? headerCell.value : undefined;
                    if (header && (typeof header === 'string' || typeof header === 'number')) {
                        rowData[header] = cell.value;
                    }
                });
                jsonData.push(rowData);
            });

            const selectedBoardId = this.questionForm.value.board;
            const selectedStandardId = this.questionForm.value.standard;
            const selectedSubjectId = this.questionForm.value.subject;
            const selectedChapterId = this.questionForm.value.chapter;

            const formattedData = jsonData.map(row => ({
                boardId: selectedBoardId,
                standardId: selectedStandardId,
                subjectId: selectedSubjectId,
                chapterId: selectedChapterId,
                question: row['Question'],
                options: [
                    row['Option1'],
                    row['Option2'],
                    row['Option3'],
                    row['Option4'],
                ],
                correctOption: row['CorrectOption']
            }));

            this.quizService.uploadQuestions(formattedData).subscribe(() => {
                this.loadQuestions();
            });
        };
        reader.readAsArrayBuffer(file);
    }

    navigateToAddQuestion(): void {
        this.router.navigate(['/quiz/manage-quiz-databank']);
    }

    downloadTemplate(): void {
        const link = document.createElement('a');
        link.href = 'assets/quiz_template.xlsx';
        link.download = 'quiz_template.xlsx';
        link.click();
    }
}
