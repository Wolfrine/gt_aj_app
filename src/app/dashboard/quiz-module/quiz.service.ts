import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, setDoc, deleteDoc, query, where, getDocs, writeBatch, DocumentReference } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SyllabusService } from '../../manage-syllabus/syllabus.service';
import { Logger } from '../../logger.service';  // Import Logger service

@Injectable({
    providedIn: 'root',
})
export class QuizService {
    constructor(private firestore: Firestore, private syllabusService: SyllabusService, private logger: Logger) { }

    getQuestionsByChapter(chapterIds: string[]): Observable<any[]> {
        const quizCollection = collection(this.firestore, 'quizbank');
        const q = query(quizCollection, where('chapterId', 'in', chapterIds));  // Handle array of chapterIds


        // Log Firestore Read Operation
        this.logger.addLog({
            type: 'READ',
            module: 'QuizService',
            method: 'getQuestionsByChapter',
            collection: 'quizbank',
            dataSize: 0, // Can calculate data size if needed
            timestamp: new Date().toISOString(),
        });

        return from(getDocs(q)).pipe(
            map(snapshot => snapshot.docs.map(doc => ({
                id: doc.id,  // Use Firestore-generated document ID
                ...doc.data()  // Include the rest of the document data
            })))
        );
    }

    addQuestion(question: any): Observable<any> {
        const quizCollection = collection(this.firestore, 'quizbank');

        // Log Firestore Write Operation
        this.logger.addLog({
            type: 'WRITE',
            module: 'QuizService',
            method: 'addQuestion',
            collection: 'quizbank',
            dataSize: JSON.stringify(question).length,
            timestamp: new Date().toISOString(),
        });

        return from(addDoc(quizCollection, question));
    }

    uploadQuestions(questions: any[]): Observable<any> {
        const quizCollection = collection(this.firestore, 'quizbank');
        const batch = writeBatch(this.firestore);

        questions.forEach(question => {
            const docRef = doc(quizCollection);
            batch.set(docRef, question);
        });

        // Log Firestore Batch Write Operation
        this.logger.addLog({
            type: 'BATCH_WRITE',
            module: 'QuizService',
            method: 'uploadQuestions',
            collection: 'quizbank',
            dataSize: JSON.stringify(questions).length,
            timestamp: new Date().toISOString(),
        });

        return from(batch.commit());
    }

    deleteQuestion(question: any): Observable<any> {
        const quizCollection = collection(this.firestore, 'quizbank');
        const q = query(quizCollection, where('question', '==', question.question));

        // Log Firestore Delete Operation
        this.logger.addLog({
            type: 'DELETE',
            module: 'QuizService',
            method: 'deleteQuestion',
            collection: 'quizbank',
            dataSize: JSON.stringify(question).length,
            timestamp: new Date().toISOString(),
        });

        return from(getDocs(q)).pipe(
            switchMap(snapshot => {
                const batch = writeBatch(this.firestore);
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                return from(batch.commit());
            })
        );
    }

    submitQuiz(answers: any[]): Observable<any> {
        console.log('Submitting quiz answers:', answers);

        // Log Quiz Submission (Can be customized as needed)
        this.logger.addLog({
            type: 'SUBMIT',
            module: 'QuizService',
            method: 'submitQuiz',
            collection: 'quiz_answers',
            dataSize: JSON.stringify(answers).length,
            timestamp: new Date().toISOString(),
        });

        return of({ success: true });
    }

    // Method to create a live quiz and save it in Firestore
    createLiveQuiz(quizData: any): Observable<DocumentReference<any>> {
        const quizCollection = collection(this.firestore, '/institutes/cynodon/live-quizzes');
        return from(addDoc(quizCollection, quizData));  // Return DocumentReference
    }

    // Common methods for loading syllabus data
    loadBoards(): Observable<{ id: string, name: string }[]> {
        return this.syllabusService.getDistinctBoards();
    }

    loadStandards(boardId: string): Observable<{ id: string, name: string }[]> {
        return this.syllabusService.getStandardsByBoard(boardId);
    }

    loadSubjects(standardId: string): Observable<{ id: string, name: string }[]> {
        return this.syllabusService.getSubjectsByStandardAndBoard(standardId);
    }

    loadChapters(subjectId: string): Observable<any[]> {
        return this.syllabusService.getChaptersByStandardBoardAndSubject(subjectId);
    }
}
