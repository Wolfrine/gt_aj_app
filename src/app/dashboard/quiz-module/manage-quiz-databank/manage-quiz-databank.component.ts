import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { QuizService } from '../quiz.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import * as ExcelJS from 'exceljs';

@Component({
    selector: 'app-manage-quiz-databank',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatTableModule,
        MatInputModule,
        MatIconModule,
    ],
    templateUrl: './manage-quiz-databank.component.html',
    styleUrls: ['./manage-quiz-databank.component.scss'],
})
export class ManageQuizDatabankComponent implements OnInit {
    questions: any[] = [];
    displayedColumns: string[] = ['question', 'options', 'actions'];
    dataSource = new MatTableDataSource<any>(this.questions);
    questionForm: FormGroup;

    constructor(private fb: FormBuilder, private quizService: QuizService) {
        this.questionForm = this.fb.group({
            question: ['', Validators.required],
            option1: ['', Validators.required],
            option2: ['', Validators.required],
            option3: ['', Validators.required],
            option4: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        this.loadQuestions();
    }

    loadQuestions(): void {
        this.quizService.getQuestions().subscribe((questions) => {
            this.questions = questions;
            this.dataSource.data = this.questions;
        });
    }

    addQuestion(): void {
        const newQuestion = {
            question: this.questionForm.value.question,
            options: [
                this.questionForm.value.option1,
                this.questionForm.value.option2,
                this.questionForm.value.option3,
                this.questionForm.value.option4,
            ],
        };

        this.quizService.addQuestion(newQuestion).subscribe(() => {
            this.loadQuestions();
            this.questionForm.reset();
        });
    }

    editQuestion(question: any): void {
        // Implement edit functionality
    }

    deleteQuestion(question: any): void {
        this.quizService.deleteQuestion(question).subscribe(() => {
            this.loadQuestions();
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

            this.quizService.uploadQuestions(jsonData).subscribe(() => {
                this.loadQuestions();
            });
        };
        reader.readAsArrayBuffer(file);
    }

}
