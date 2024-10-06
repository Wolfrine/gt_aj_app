import { Injectable } from '@angular/core';
import { Firestore, collection, query, limit, orderBy, startAfter, getDocs, collectionData, addDoc, doc, deleteDoc, docData, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Logger } from '../logger.service';

@Injectable({
    providedIn: 'root'
})
export class NewsService {
    constructor(
        private firestore: Firestore,
        private _snackBar: MatSnackBar,
        private logger: Logger  // Inject Logger service
    ) { }

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

        // Log Firestore Read Operation
        this.logger.addLog({
            type: 'READ',
            module: 'NewsService',
            method: 'getNews',
            collection: `institutes/${instituteId}/newsEvents`,
            dataSize: 0,  // The actual size can be logged after fetching if required
            timestamp: new Date().toISOString(),
        });

        return collectionData(q, { idField: 'id' });
    }

    async getMoreNews(instituteId: string, lastVisibleDoc: any, pageSize: number = 10): Promise<any[]> {
        const newsCollection = collection(this.firestore, `institutes/${instituteId}/newsEvents`);
        const q = query(newsCollection, orderBy('date', 'desc'), startAfter(lastVisibleDoc), limit(pageSize));

        console.log('Fetching more news events...');
        const querySnapshot = await getDocs(q);

        // Log Firestore Read Operation
        this.logger.addLog({
            type: 'READ',
            module: 'NewsService',
            method: 'getMoreNews',
            collection: `institutes/${instituteId}/newsEvents`,
            dataSize: querySnapshot.size,
            timestamp: new Date().toISOString(),
        });

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

            // Log Firestore Write Operation
            this.logger.addLog({
                type: 'WRITE',
                module: 'NewsService',
                method: 'addNews',
                collection: `institutes/${instituteId}/newsEvents`,
                dataSize: JSON.stringify(news).length,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            this.openSnackBar('Failed to add news, please try again later', 'Cancel');
            console.error('Error adding news:', error);
            throw new Error('Failed to add news. Please try again later.');
        }
    }

    deleteNews(instituteId: string, newsId: string) {
        const newsDoc = doc(this.firestore, `institutes/${instituteId}/newsEvents/${newsId}`);

        // Log Firestore Delete Operation
        this.logger.addLog({
            type: 'DELETE',
            module: 'NewsService',
            method: 'deleteNews',
            collection: `institutes/${instituteId}/newsEvents`,
            dataSize: 1,  // 1 document deleted
            timestamp: new Date().toISOString(),
        });

        return deleteDoc(newsDoc);
    }

    getNewsEventById(instituteId: string, newsId: string): Observable<any> {
        const newsDoc = doc(this.firestore, `institutes/${instituteId}/newsEvents/${newsId}`);
        console.log(newsDoc.id);

        // Log Firestore Read Operation
        this.logger.addLog({
            type: 'READ',
            module: 'NewsService',
            method: 'getNewsEventById',
            collection: `institutes/${instituteId}/newsEvents`,
            dataSize: 1,
            timestamp: new Date().toISOString(),
        });

        return docData(newsDoc, { idField: 'id' });
    }

    getNewsByTitle(instituteId: string, title: string): Observable<any[]> {
        const newsCollection = collection(this.firestore, `institutes/${instituteId}/newsEvents`);
        const q = query(newsCollection, where('title', '==', title));

        // Log Firestore Query Operation
        this.logger.addLog({
            type: 'READ',
            module: 'NewsService',
            method: 'getNewsByTitle',
            collection: `institutes/${instituteId}/newsEvents`,
            dataSize: 0,
            timestamp: new Date().toISOString(),
        });

        return collectionData(q, { idField: 'id' });
    }

    async uploadImage(file: File): Promise<string> {
        const storage = getStorage();
        const storageRef = ref(storage, `news-images/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        // Log Firebase Storage Upload
        this.logger.addLog({
            type: 'UPLOAD',
            module: 'NewsService',
            method: 'uploadImage',
            collection: `news-images`,
            dataSize: file.size,
            timestamp: new Date().toISOString(),
        });

        return url;
    }
}
