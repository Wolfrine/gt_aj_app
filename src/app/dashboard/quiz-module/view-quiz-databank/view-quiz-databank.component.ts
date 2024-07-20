import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QuizService } from '../quiz.service';
import { SyllabusService } from '../../../manage-syllabus/syllabus.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import * as ExcelJS from 'exceljs';

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
export class ViewQuizDatabankComponent implements OnInit {
    boards: string[] = [];
    standards: string[] = [];
    subjects: string[] = [];
    chapters: string[] = [];
    selectedBoard: string = '';
    selectedStandard: string = '';
    selectedSubject: string = '';
    selectedChapter: string = '';
    questions: any[] = [];
    displayedColumns: string[] = ['question', 'options'];

    constructor(
        private router: Router,
        private quizService: QuizService,
        private syllabusService: SyllabusService
    ) { }

    ngOnInit(): void {
        this.loadBoards();
    }

    loadBoards(): void {
        this.syllabusService.getDistinctBoards().subscribe((boards) => {
            this.boards = boards;
        });
    }

    loadStandards(): void {
        if (this.selectedBoard) {
            this.syllabusService.getStandardsByBoard(this.selectedBoard).subscribe((standards) => {
                this.standards = standards;
            });
        }
    }

    loadSubjects(): void {
        if (this.selectedBoard && this.selectedStandard) {
            const standardId = `${this.selectedStandard}_${this.selectedBoard}`;
            this.syllabusService.getSubjectsByStandardAndBoard(standardId, this.selectedBoard).subscribe((subjects) => {
                this.subjects = subjects;
            });
        }
    }

    loadChapters(): void {
        if (this.selectedBoard && this.selectedStandard && this.selectedSubject) {
            const subjectId = `${this.selectedSubject}_${this.selectedStandard}_${this.selectedBoard}`;
            this.syllabusService.getChaptersByStandardBoardAndSubject(this.selectedStandard, this.selectedBoard, subjectId).subscribe((chapters) => {
                this.chapters = chapters.map(chapter => chapter.name);
            });
        }
    }

    loadQuestions(): void {
        this.quizService.getQuestionsByChapter(this.selectedBoard, this.selectedStandard, this.selectedSubject, this.selectedChapter).subscribe((questions) => {
            this.questions = questions;
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

    navigateToAddQuestion(): void {
        this.router.navigate(['/manage-quiz-databank']);
    }
}
