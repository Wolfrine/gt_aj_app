import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class QuizService {
    constructor(private http: HttpClient) { }

    private questions: any[] = []; // This should be replaced with actual data source

    getQuestions(): Observable<any[]> {
        // Replace with actual API call to get questions
        const dummyQuestions = [
            {
                question: 'What is the capital of France?',
                options: ['Paris', 'London', 'Berlin', 'Madrid'],
            },
            {
                question: 'What is 2 + 2?',
                options: ['3', '4', '5', '6'],
            },
            // Add more questions here
        ];
        return of(dummyQuestions);
    }

    addQuestion(question: any): Observable<any> {
        // Replace with actual API call to add a question
        this.questions.push(question);
        return of(question);
    }

    editQuestion(question: any): Observable<any> {
        // Replace with actual API call to edit a question
        const index = this.questions.findIndex(q => q.question === question.question);
        if (index !== -1) {
            this.questions[index] = question;
        }
        return of(question);
    }

    deleteQuestion(question: any): Observable<any> {
        // Replace with actual API call to delete a question
        this.questions = this.questions.filter(q => q.question !== question.question);
        return of(question);
    }

    uploadQuestions(questions: any[]): Observable<any> {
        // Replace with actual API call to upload questions
        this.questions.push(...questions);
        return of({ success: true });
    }

    submitQuiz(answers: any[]): Observable<any> {
        // Replace with actual API call to submit quiz answers
        console.log('Submitting quiz answers:', answers);
        return of({ success: true });
    }
}
