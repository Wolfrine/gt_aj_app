import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, setDoc, deleteDoc, query, where, getDocs, writeBatch, DocumentReference, updateDoc, Timestamp, getDoc, docData, arrayUnion, orderBy, limit } from '@angular/fire/firestore';
import { Observable, from, of, combineLatest, forkJoin } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { SyllabusService } from '../../manage-syllabus/syllabus.service';
import { Logger } from '../../logger.service';
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
            }))),
            catchError(error => {
                console.error("Error fetching questions:", error);
                this.logger.addLog({
                    type: 'ERROR',
                    module: 'QuizService',
                    method: 'getQuestionsByChapter',
                    message: `Error fetching questions: ${error.message}`,
                    timestamp: new Date().toISOString(),
                });
                return of([]);
            })
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
        return from(addDoc(quizCollection, question)).pipe(
            catchError(error => {
                console.error("Error adding question:", error);
                this.logger.addLog({
                    type: 'ERROR',
                    module: 'QuizService',
                    method: 'addQuestion',
                    message: `Error adding question: ${error.message}`,
                    timestamp: new Date().toISOString(),
                });
                return of(null);
            })
        );
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

        return from(batch.commit()).pipe(
            catchError(error => {
                console.error("Error uploading questions:", error);
                this.logger.addLog({
                    type: 'ERROR',
                    module: 'QuizService',
                    method: 'uploadQuestions',
                    message: `Error uploading questions: ${error.message}`,
                    timestamp: new Date().toISOString(),
                });
                return of(null);
            })
        );
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
            }),
            catchError(error => {
                console.error("Error deleting question:", error);
                this.logger.addLog({
                    type: 'ERROR',
                    module: 'QuizService',
                    method: 'deleteQuestion',
                    message: `Error deleting question: ${error.message}`,
                    timestamp: new Date().toISOString(),
                });
                return of(null);
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

    createLiveQuiz(quizData: any): Observable<DocumentReference<any> | null> {
        const quizCollection = collection(this.firestore, `/institutes/${this.customizationService.getSubdomainFromUrl()}/quiz`);
        const liveQuizData = { ...quizData, quiz_type: 'live' };

        this.logger.addLog({
            type: 'WRITE',
            module: 'QuizService',
            method: 'createLiveQuiz',
            collection: `institutes/${this.customizationService.getSubdomainFromUrl()}/quiz`,
            dataSize: JSON.stringify(liveQuizData).length,
            timestamp: new Date().toISOString(),
        });

        return from(addDoc(quizCollection, liveQuizData)).pipe(
            catchError(error => {
                console.error("Error creating live quiz:", error);
                this.logger.addLog({
                    type: 'ERROR',
                    module: 'QuizService',
                    method: 'createLiveQuiz',
                    message: `Error creating live quiz: ${error.message}`,
                    timestamp: new Date().toISOString(),
                });
                return of(null);
            })
        );
    }



    updateQuiz(instituteId: string, quizId: string, updatedQuizData: any): Observable<void | null> {
        const quizDocRef = doc(this.firestore, `/institutes/${instituteId}/quiz/${quizId}`);

        this.logger.addLog({
            type: 'UPDATE',
            module: 'QuizService',
            method: 'updateQuiz',
            collection: `institutes/${instituteId}/quiz`,
            dataSize: JSON.stringify(updatedQuizData).length,
            timestamp: new Date().toISOString(),
        });

        return from(updateDoc(quizDocRef, updatedQuizData)).pipe(
            catchError(error => {
                console.error("Error updating quiz:", error);
                this.logger.addLog({
                    type: 'ERROR',
                    module: 'QuizService',
                    method: 'updateQuiz',
                    message: `Error updating quiz: ${error.message}`,
                    timestamp: new Date().toISOString(),
                });
                return of(null);
            })
        );
    }

    deleteQuiz(instituteId: string, quizId: string): Observable<void | null> {
        const quizDocRef = doc(this.firestore, `/institutes/${instituteId}/quiz/${quizId}`);

        this.logger.addLog({
            type: 'DELETE',
            module: 'QuizService',
            method: 'deleteQuiz',
            collection: `institutes/${instituteId}/quiz`,
            dataSize: 0,
            timestamp: new Date().toISOString(),
        });

        return from(deleteDoc(quizDocRef)).pipe(
            catchError(error => {
                console.error("Error deleting quiz:", error);
                this.logger.addLog({
                    type: 'ERROR',
                    module: 'QuizService',
                    method: 'deleteQuiz',
                    message: `Error deleting quiz: ${error.message}`,
                    timestamp: new Date().toISOString(),
                });
                return of(null);
            })
        );
    }

    addParticipant(instituteId: string, quizId: string, participantEmail: string): Observable<void | null> {
        const quizDocRef = doc(this.firestore, `/institutes/${instituteId}/quiz/${quizId}`);

        this.logger.addLog({
            type: 'UPDATE',
            module: 'QuizService',
            method: 'addParticipant',
            collection: `institutes/${instituteId}/quiz/${quizId}`,
            dataSize: participantEmail.length,
            timestamp: new Date().toISOString(),
        });

        return from(updateDoc(quizDocRef, {
            participants: arrayUnion(participantEmail)
        })).pipe(
            catchError(error => {
                console.error("Error adding participant:", error);
                this.logger.addLog({
                    type: 'ERROR',
                    module: 'QuizService',
                    method: 'addParticipant',
                    message: `Error adding participant: ${error.message}`,
                    timestamp: new Date().toISOString(),
                });
                return of(null);
            })
        );
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

    submitAnswer(quizId: string, sessionId: string, answerData: any): Observable<void | null> {
        const questionId = answerData.questionID; // Use the questionID from answerData
        const responseDocRef = doc(this.firestore, `/institutes/${this.customizationService.getSubdomainFromUrl()}/quiz/${quizId}/quizResponses/${sessionId}`);

        return from(updateDoc(responseDocRef, {
            [questionId]: arrayUnion(answerData) // Add the answer data to the array for this specific questionId
        })).pipe(
            catchError(error => {
                // If the document doesn't exist yet, create it with initial structure
                if (error.code === 'not-found') {
                    const initialData = {
                        sessionId: sessionId,
                        createdOn: new Date().toISOString(),
                        [questionId]: [answerData] // Initialize with the first answer for this questionId
                    };
                    return from(setDoc(responseDocRef, initialData));
                } else {
                    console.error("Error submitting answer:", error);
                    return of(null);
                }
            })
        );
    }

    getSessionResponses(quizId: string, sessionId: string): Observable<Record<string, any>> {
        const responseDocRef = doc(this.firestore, `/institutes/${this.customizationService.getSubdomainFromUrl()}/quiz/${quizId}/quizResponses/${sessionId}`);

        return docData(responseDocRef).pipe(
            map(responseData => {
                if (!responseData) {
                    console.warn("No response data found for session:", sessionId);
                    return {}; // Return an empty object if no data is found
                }

                return Object.keys(responseData)
                    .filter(key => key !== 'sessionId' && key !== 'createdOn')
                    .reduce((acc: Record<string, any>, questionId) => {
                        acc[questionId] = responseData[questionId];
                        return acc;
                    }, {});
            }),
            catchError(error => {
                console.error("Error fetching session responses:", error);
                return of({}); // Return an empty object in case of an error
            })
        );
    }

    getLatestSessionId(quizId: string): Observable<string | null> {
        const sessionCollection = collection(this.firestore, `/institutes/${this.customizationService.getSubdomainFromUrl()}/quiz/${quizId}/quizResponses`);
        const latestSessionQuery = query(sessionCollection, orderBy('createdOn', 'desc'), limit(1));

        return from(getDocs(latestSessionQuery)).pipe(
            map(snapshot => {
                const doc = snapshot.docs[0];
                return doc ? doc.id : null;
            }),
            catchError(error => {
                console.error("Error fetching latest session ID:", error);
                return of(null);
            })
        );
    }



}
