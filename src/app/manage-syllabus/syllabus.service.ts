import { Injectable } from '@angular/core';
import { Firestore, collectionData, collection, doc, setDoc, updateDoc } from '@angular/fire/firestore';
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

    addBoardToStandard(standardId: string, boardName: string): Promise<void> {
        const standardDocRef = doc(this.firestore, `syllabus/${standardId}`);
        return updateDoc(standardDocRef, {
            [`boards.${boardName}`]: { subjects: [] }
        });
    }

    addSubjectToBoard(standardId: string, boardName: string, subjectName: string): Promise<void> {
        const standardDocRef = doc(this.firestore, `syllabus/${standardId}`);
        return updateDoc(standardDocRef, {
            [`boards.${boardName}.subjects`]: {
                [subjectName.toLowerCase()]: { id: subjectName.toLowerCase(), name: subjectName, chapters: [] }
            }
        });
    }

    addChapterToSubject(standardId: string, boardName: string, subjectName: string, chapterName: string): Promise<void> {
        const standardDocRef = doc(this.firestore, `syllabus/${standardId}`);
        return updateDoc(standardDocRef, {
            [`boards.${boardName}.subjects.${subjectName.toLowerCase()}.chapters`]: {
                [chapterName.toLowerCase()]: { id: chapterName.toLowerCase(), name: chapterName }
            }
        });
    }

    updateChapterName(standardId: string, boardName: string, subjectName: string, chapterId: string, newName: string): Promise<void> {
        const standardDocRef = doc(this.firestore, `syllabus/${standardId}`);
        return updateDoc(standardDocRef, {
            [`boards.${boardName}.subjects.${subjectName.toLowerCase()}.chapters.${chapterId}.name`]: newName
        });
    }
}
