import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, setDoc, deleteDoc, query, where, getDocs, writeBatch } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class QuizService {
    constructor(private firestore: Firestore) { }

    getQuestionsByChapter(boardId: string, standardId: string, subjectId: string, chapterId: string): Observable<any[]> {
        const quizCollection = collection(this.firestore, 'quizbank');
        const q = query(quizCollection, where('boardId', '==', boardId), where('standardId', '==', standardId), where('subjectId', '==', subjectId), where('chapterId', '==', chapterId));
        return from(getDocs(q)).pipe(
            map(snapshot => snapshot.docs.map(doc => doc.data()))
        );
    }

    addQuestion(question: any): Observable<any> {
        const quizCollection = collection(this.firestore, 'quizbank');
        return from(addDoc(quizCollection, question));
    }

    uploadQuestions(questions: any[]): Observable<any> {
        const quizCollection = collection(this.firestore, 'quizbank');
        const batch = writeBatch(this.firestore);
        questions.forEach(question => {
            const docRef = doc(quizCollection);
            batch.set(docRef, question);
        });
        return from(batch.commit());
    }

    deleteQuestion(question: any): Observable<any> {
        const quizCollection = collection(this.firestore, 'quizbank');
        const q = query(quizCollection, where('question', '==', question.question));
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
        // Replace with actual API call to submit quiz answers
        console.log('Submitting quiz answers:', answers);
        return of({ success: true });
    }
}
