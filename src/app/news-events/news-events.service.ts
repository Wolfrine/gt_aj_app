import { Injectable } from '@angular/core';
import { Firestore, collection, query, limit, orderBy, startAfter, getDocs, collectionData, addDoc, doc, deleteDoc, docData, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NewsService {
    constructor(private firestore: Firestore) { }

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

    addNews(instituteId: string, news: any) {
        const newsCollection = collection(this.firestore, `institutes/${instituteId}/newsEvents`);
        return addDoc(newsCollection, news);
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
}
