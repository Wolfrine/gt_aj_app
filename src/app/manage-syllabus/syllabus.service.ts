import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, setDoc, updateDoc, getDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { SyllabusNode } from './syllabus.interface';

@Injectable({
    providedIn: 'root'
})
export class SyllabusService {
    constructor(private firestore: Firestore) { }

    getSyllabusList(): Observable<SyllabusNode[]> {
        const syllabusCollection = collection(this.firestore, 'syllabus');
        return collectionData(syllabusCollection, { idField: 'id' }) as Observable<SyllabusNode[]>;
    }

    updateSyllabus(syllabus: SyllabusNode): Promise<void> {
        const syllabusDocRef = doc(this.firestore, `syllabus/${syllabus.id}`);
        return setDoc(syllabusDocRef, syllabus);
    }

    async addBoardToStandard(standardId: string, boardName: string): Promise<void> {
        const standardDocRef = doc(this.firestore, `syllabus/${standardId}`);
        const standardDoc = await getDoc(standardDocRef);
        const standardData = standardDoc.data();
        if (!standardDoc.exists() || !standardData || !Array.isArray(standardData['children'])) {
            throw new Error(`Standard with ID ${standardId} does not exist or has invalid structure.`);
        }

        const updatedChildren = [
            ...standardData['children'],
            {
                id: boardName,
                name: boardName,
                children: []
            }
        ];

        return updateDoc(standardDocRef, { children: updatedChildren });
    }

    async addSubjectToBoard(standardId: string, boardName: string, subjectName: string): Promise<void> {
        const standardDocRef = doc(this.firestore, `syllabus/${standardId}`);
        const standardDoc = await getDoc(standardDocRef);
        const standardData = standardDoc.data();
        if (!standardDoc.exists() || !standardData || !Array.isArray(standardData['children'])) {
            throw new Error(`Standard with ID ${standardId} does not exist or has invalid structure.`);
        }

        const board = standardData['children'].find((board: SyllabusNode) => board.name === boardName);
        if (!board) {
            throw new Error(`Board with ID ${boardName} does not exist under standard ${standardId}.`);
        }
        const boardIndex = standardData['children'].findIndex((board: SyllabusNode) => board.name === boardName);

        const updatedBoard = {
            ...board,
            children: [
                ...board.children,
                {
                    id: subjectName.toLowerCase(),
                    name: subjectName,
                    children: []
                }
            ]
        };

        const updatedChildren = [...standardData['children']];
        updatedChildren[boardIndex] = updatedBoard;

        return updateDoc(standardDocRef, { children: updatedChildren });
    }

    async addChapterToSubject(standardId: string, boardName: string, subjectName: string, chapterName: string): Promise<void> {
        const standardDocRef = doc(this.firestore, `syllabus/${standardId}`);
        const standardDoc = await getDoc(standardDocRef);
        const standardData = standardDoc.data();
        if (!standardDoc.exists() || !standardData || !Array.isArray(standardData['children'])) {
            throw new Error(`Standard with ID ${standardId} does not exist or has invalid structure.`);
        }

        const board = standardData['children'].find((board: SyllabusNode) => board.name === boardName);
        if (!board) {
            throw new Error(`Board with ID ${boardName} does not exist under standard ${standardId}.`);
        }
        const subject = board.children.find((subject: SyllabusNode) => subject.name === subjectName);
        if (!subject) {
            throw new Error(`Subject with ID ${subjectName} does not exist under board ${boardName} in standard ${standardId}.`);
        }
        const boardIndex = standardData['children'].findIndex((board: SyllabusNode) => board.name === boardName);
        const subjectIndex = board.children.findIndex((subject: SyllabusNode) => subject.name === subjectName);

        const updatedSubject = {
            ...subject,
            children: [
                ...subject.children,
                {
                    id: chapterName.toLowerCase(),
                    name: chapterName
                }
            ]
        };

        const updatedBoard = {
            ...board,
            children: [...board.children]
        };
        updatedBoard.children[subjectIndex] = updatedSubject;
        const updatedChildren = [...standardData['children']];
        updatedChildren[boardIndex] = updatedBoard;

        return updateDoc(standardDocRef, { children: updatedChildren });
    }

    updateChapterName(standardId: string, boardName: string, subjectName: string, chapterId: string, newName: string): Promise<void> {
        const standardDocRef = doc(this.firestore, `syllabus/${standardId}`);
        return updateDoc(standardDocRef, {
            [`children.${boardName}.children.${subjectName.toLowerCase()}.children.${chapterId}.name`]: newName
        });
    }
}
