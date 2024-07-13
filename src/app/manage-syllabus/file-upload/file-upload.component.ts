import { Component } from '@angular/core';
import { SyllabusService } from '../syllabus.service';
import * as ExcelJS from 'exceljs';

@Component({
    selector: 'app-file-upload',
    standalone: true,
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {

    constructor(private syllabusService: SyllabusService) { }

    onFileChange(event: any) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = async (e: any) => {
            const buffer = e.target.result;
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);
            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) {
                console.error('Worksheet is undefined');
                return;
            }
            const jsonData: { [key: string]: any }[] = [];

            worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                if (rowNumber === 1) {
                    // Skip header row
                    return;
                }
                const rowData: { [key: string]: any } = {};
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const headerCell = worksheet.getRow(1).getCell(colNumber);
                    const header = typeof headerCell.value === 'string' ? headerCell.value : headerCell.text;
                    if (typeof header === 'string') {
                        rowData[header] = cell.value;
                    }
                });
                jsonData.push(rowData);
            });

            console.log('Processed JSON Data:', jsonData);  // Log the JSON data to debug
            this.processData(jsonData);
        };
        reader.readAsArrayBuffer(file);
    }

    async processData(data: any) {
        const boards: { [key: string]: any } = {};
        const standards: { [key: string]: any } = {};
        const subjects: { [key: string]: any } = {};
        const chapters: { [key: string]: any } = {};
        const syllabus = [];

        for (const entry of data) {
            const boardName = entry['Board'];
            const standardName = entry['Standard'];
            const subjectName = entry['Subject'];
            const chapterNumber = entry['Chapter No'];
            const chapterName = entry['Chapter Name'];

            if (!boards[boardName]) {
                boards[boardName] = {
                    name: boardName,
                    description: `${boardName} Board`
                };
            }

            const standardId = `${standardName}_${boardName}`;
            if (!standards[standardId]) {
                standards[standardId] = {
                    boardId: boardName,
                    name: standardName,
                    description: `${standardName}th Standard`
                };
            }

            const subjectId = `${subjectName}_${standardId}`;
            if (!subjects[subjectId]) {
                subjects[subjectId] = {
                    standardId: standardId,
                    name: subjectName,
                    description: `${subjectName} for ${standardName}th Standard`
                };
            }

            const chapterId = `chapter_${chapterNumber}_${subjectId}`;
            if (!chapters[chapterId]) {
                chapters[chapterId] = {
                    subjectId: subjectId,
                    chapterNumber: chapterNumber,
                    name: chapterName,
                    description: `Description of chapter ${chapterNumber}`
                };
            }

            syllabus.push({
                boardId: boardName,
                standardId: standardId,
                subjectId: subjectId,
                chapterId: chapterId,
                createdAt: new Date().toISOString()
            });
        }

        await this.syllabusService.uploadToFirestore(boards, 'boards');
        await this.syllabusService.uploadToFirestore(standards, 'standards');
        await this.syllabusService.uploadToFirestore(subjects, 'subjects');
        await this.syllabusService.uploadToFirestore(chapters, 'chapters');
        await this.syllabusService.uploadSyllabusToFirestore(syllabus);
    }
}
