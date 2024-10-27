import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, setDoc, deleteDoc, query, where, getDocs, writeBatch, DocumentReference, updateDoc, Timestamp, getDoc, docData, arrayUnion } from '@angular/fire/firestore';
import { Observable, from, of, combineLatest, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SyllabusService } from '../../manage-syllabus/syllabus.service';
import { Logger } from '../../logger.service';  // Import Logger service
import { CustomizationService } from '../../customization.service';

@Injectable({
    providedIn: 'root',
})
export class QuizService {
    constructor(
        private firestore: Firestore,
        private syllabusService: SyllabusService,
        private logger: Logger,
        private customizationService: CustomizationService
    ) { }

    getQuestionsByChapter(chapterIds: string[]): Observable<any[]> {
        const quizCollection = collection(this.firestore, 'quizbank');
        const q = query(quizCollection, where('chapterId', 'in', chapterIds));

        // Log Firestore Read Operation
        this.logger.addLog({
            type: 'READ',
            module: 'QuizService',
            method: 'getQuestionsByChapter',
            collection: 'quizbank',
            dataSize: 0,
            timestamp: new Date().toISOString(),
        });

        return from(getDocs(q)).pipe(
            map(snapshot => snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })))
        );
    }

    addQuestion(question: any): Observable<any> {
        const quizCollection = collection(this.firestore, 'quizbank');
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

    createLiveQuiz(quizData: any): Observable<DocumentReference<any>> {
        const quizCollection = collection(this.firestore, `/institutes/${this.customizationService.getSubdomainFromUrl()}/quiz`);
        const liveQuizData = { ...quizData, quiz_type: 'live' };
        return from(addDoc(quizCollection, liveQuizData));
    }

    updateQuiz(instituteId: string, quizId: string, updatedQuizData: any): Observable<void> {
        const quizDocRef = doc(this.firestore, `/institutes/${instituteId}/quiz/${quizId}`);
        return from(updateDoc(quizDocRef, updatedQuizData));
    }

    deleteQuiz(instituteId: string, quizId: string): Observable<void> {
        const quizDocRef = doc(this.firestore, `/institutes/${instituteId}/quiz/${quizId}`);
        return from(deleteDoc(quizDocRef));
    }

    getAllQuizzes(instituteId: string): Observable<any[]> {
        const quizzesCollection = collection(this.firestore, `/institutes/${instituteId}/quiz`);
        return collectionData(quizzesCollection, { idField: 'id' }).pipe(
            map((quizzes: any[]) => this.calculateQuizStatus(quizzes))
        );
    }

    getQuizById(instituteId: string, quizId: string): Observable<any> {
        const quizDocRef = doc(this.firestore, `/institutes/${instituteId}/quiz/${quizId}`);

        return docData(quizDocRef).pipe(
            switchMap(quizData => {
                if (!quizData || !quizData['questionIds']) {
                    return of(quizData);
                }

                const questionCollectionRef = collection(this.firestore, 'quizbank');
                const questionFetches = quizData['questionIds'].map((questionId: string) =>
                    getDoc(doc(questionCollectionRef, questionId)).then(snapshot => ({
                        id: questionId,
                        ...snapshot.data()
                    }))
                );

                return forkJoin(questionFetches).pipe(
                    map(questions => ({
                        ...quizData,
                        questions
                    }))
                );
            })
        );
    }

    updateCurrentQuestionIndex(quizId: string, currentQuestionIndex: number): Observable<void> {
        const quizDocRef = doc(this.firestore, `/institutes/${this.customizationService.getSubdomainFromUrl()}/quiz/${quizId}`);
        return from(updateDoc(quizDocRef, { currentQuestion: currentQuestionIndex }));
    }

    listenToCurrentQuestionIndex(quizId: string): Observable<number> {
        const quizDocRef = doc(this.firestore, `/institutes/${this.customizationService.getSubdomainFromUrl()}/quiz/${quizId}`);
        return docData(quizDocRef).pipe(map(doc => doc?.['currentQuestion'] || 0));
    }

    getAllLiveQuizzes(instituteId: string): Observable<any[]> {
        const quizzesCollection = collection(this.firestore, `/institutes/${instituteId}/quiz`);
        const q = query(quizzesCollection, where('quiz_type', '==', 'live'));

        return collectionData(q, { idField: 'id' }).pipe(
            map((quizzes: any[]) => this.calculateQuizStatus(quizzes))
        );
    }

    calculateQuizStatus(quizzes: any[]): any[] {
        return quizzes.map(quiz => {
            const now = new Date();
            const quizDateTime = quiz.date instanceof Timestamp ? quiz.date.toDate() : new Date(quiz.date);

            quiz.currentQuestion = quiz.currentQuestion || 0;

            if (quiz.currentQuestion === 0 && quizDateTime >= now) {
                quiz.status = 'upcoming';
            } else if (quiz.currentQuestion > 0 && quiz.currentQuestion < quiz.questionIds.length && !quiz.endTime) {
                quiz.status = 'live';
            } else if (quiz.endTime) {
                quiz.endTime = quiz.endTime instanceof Timestamp ? quiz.endTime.toDate() : quiz.endTime;
                quiz.status = 'completed';
            } else {
                quiz.endTime = quiz.endTime instanceof Timestamp ? quiz.endTime.toDate() : quiz.endTime;
                quiz.status = 'unknown';
            }

            return quiz;
        });
    }

    addParticipant(instituteId: string, quizId: string, participantEmail: string): Observable<void> {
        const quizDocRef = doc(this.firestore, `/institutes/${instituteId}/quiz/${quizId}`);
        return from(updateDoc(quizDocRef, {
            participants: arrayUnion(participantEmail)  // Add user to participants array
        }));
    }

}
