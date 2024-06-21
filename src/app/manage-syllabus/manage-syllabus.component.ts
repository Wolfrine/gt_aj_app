import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { SyllabusService } from './syllabus.service';
import { Syllabus, Board, Subject, Chapter, sampleSyllabus } from './syllabus.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-manage-syllabus',
    standalone: true,
    templateUrl: './manage-syllabus.component.html',
    styleUrls: ['./manage-syllabus.component.scss'],
    imports: [CommonModule, MatExpansionModule, FormsModule, ReactiveFormsModule, MatIconModule, MatInputModule, MatSelectModule]
})
export class ManageSyllabusComponent implements OnInit {
    syllabusList: Syllabus[] = sampleSyllabus;
    selectedStandardId: string = '10'; // Default standard
    selectedBoard: string = 'icse'; // Default board
    newBoardForm: FormGroup;
    newSubjectForm: FormGroup;
    newChapterForm: FormGroup;
    editingChapterId: string | null = null;
    showNewBoardInput: boolean = false;
    showNewSubjectInput: boolean = false;
    showNewChapterInput: { [subjectId: string]: boolean } = {};

    constructor(private syllabusService: SyllabusService) {
        this.newBoardForm = new FormGroup({
            boardName: new FormControl(''),
        });

        this.newSubjectForm = new FormGroup({
            subjectName: new FormControl(''),
        });

        this.newChapterForm = new FormGroup({
            chapterName: new FormControl(''),
        });
    }

    ngOnInit(): void {
        this.syllabusService.getSyllabusList().subscribe(data => {
            this.syllabusList = data;
        });
    }

    get selectedStandard(): Syllabus | undefined {
        return this.syllabusList.find(standard => standard.id === this.selectedStandardId);
    }

    getBoardKeys(): string[] {
        return this.selectedStandard ? Object.keys(this.selectedStandard.boards) : [];
    }

    addBoard(): void {
        const boardName = this.newBoardForm.value.boardName;
        if (this.selectedStandard && boardName && !this.selectedStandard.boards[boardName]) {
            this.syllabusService.addBoardToStandard(this.selectedStandard.id, boardName).then(() => {
                this.selectedStandard!.boards[boardName] = { subjects: [] };
                this.newBoardForm.reset();
                this.showNewBoardInput = false;
            });
        }
    }

    addSubject(): void {
        const subjectName = this.newSubjectForm.value.subjectName;
        if (this.selectedStandard && subjectName && this.selectedBoard) {
            const board = this.selectedStandard.boards[this.selectedBoard];
            if (board) {
                this.syllabusService.addSubjectToBoard(this.selectedStandard.id, this.selectedBoard, subjectName).then(() => {
                    board.subjects.push({ id: subjectName.toLowerCase(), name: subjectName, chapters: [] });
                    this.newSubjectForm.reset();
                    this.showNewSubjectInput = false;
                });
            }
        }
    }

    addChapter(subject: Subject): void {
        const chapterName = this.newChapterForm.value.chapterName;
        if (chapterName && this.selectedStandard) {
            this.syllabusService.addChapterToSubject(this.selectedStandard.id, this.selectedBoard, subject.id, chapterName).then(() => {
                subject.chapters.push({ id: chapterName.toLowerCase(), name: chapterName });
                this.newChapterForm.reset();
                this.showNewChapterInput[subject.id] = false;
            });
        }
    }

    updateChapterName(chapter: Chapter, newName: string): void {
        if (this.selectedStandard) {
            this.syllabusService.updateChapterName(this.selectedStandard.id, this.selectedBoard, chapter.id, chapter.id, newName).then(() => {
                chapter.name = newName;
            });
        }
    }

    toggleEditChapter(chapter: Chapter): void {
        this.editingChapterId = this.editingChapterId === chapter.id ? null : chapter.id;
    }

    toggleNewBoardInput(): void {
        this.showNewBoardInput = !this.showNewBoardInput;
    }

    toggleNewSubjectInput(): void {
        this.showNewSubjectInput = !this.showNewSubjectInput;
    }

    toggleNewChapterInput(subjectId: string): void {
        this.showNewChapterInput[subjectId] = !this.showNewChapterInput[subjectId];
    }
}
