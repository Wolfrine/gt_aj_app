// news-events.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, query, limit, orderBy, startAfter, getDocs, collectionData, addDoc, doc, deleteDoc, docData, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})
export class NewsService {
    constructor(private firestore: Firestore,
        private _snackBar: MatSnackBar) { }

    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action);
    }

    getNews(instituteId: string, lastDoc: any = null, pageSize: number = 10): Observable<any[]> {
        console.log('getNews called');
        const newsCollection = collection(this.firestore, `institutes/${instituteId}/newsEvents`);
        let q;

        if (lastDoc) {
            q = query(newsCollection, orderBy('date', 'desc'), startAfter(lastDoc), limit(pageSize));
        } else {
            q = query(newsCollection, orderBy('date', 'desc'), limit(pageSize));
        }

        return collectionData(q, { idField: 'id' });
    }

    async getMoreNews(instituteId: string, lastVisibleDoc: any, pageSize: number = 10): Promise<any[]> {
        const newsCollection = collection(this.firestore, `institutes/${instituteId}/newsEvents`);
        const q = query(newsCollection, orderBy('date', 'desc'), startAfter(lastVisibleDoc), limit(pageSize));

        console.log('Fetching more news events...');
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    async addNews(instituteId: string, news: any): Promise<void> {
        try {
            console.log(news);
            const newsCollection = collection(this.firestore, `institutes/${instituteId}/newsEvents`);
            await addDoc(newsCollection, news);
            console.log('News added successfully');
        } catch (error) {
            this.openSnackBar('Failed to add news, please try again later', 'Cancel');
            console.error('Error adding news:', error);
            throw new Error('Failed to add news. Please try again later.');
        }
    }

    deleteNews(instituteId: string, newsId: string) {
        const newsDoc = doc(this.firestore, `institutes/${instituteId}/newsEvents/${newsId}`);
        return deleteDoc(newsDoc);
    }

    getNewsEventById(instituteId: string, newsId: string): Observable<any> {
        const newsDoc = doc(this.firestore, `institutes/${instituteId}/newsEvents/${newsId}`);
        console.log(newsDoc.id);
        return docData(newsDoc, { idField: 'id' });
    }

    getNewsByTitle(instituteId: string, title: string): Observable<any[]> {
        const newsCollection = collection(this.firestore, `institutes/${instituteId}/newsEvents`);
        const q = query(newsCollection, where('title', '==', title));
        return collectionData(q, { idField: 'id' });
    }

    // Add method to upload image to Firebase Storage
    async uploadImage(file: File): Promise<string> {
        const storage = getStorage();
        const storageRef = ref(storage, `news-images/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return url;
    }
}
