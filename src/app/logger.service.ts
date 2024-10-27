import { Firestore, doc, getDoc, setDoc, collection, getDocs } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class Logger {
    private logLength: number = 100;  // Default in case fetching fails
    private logs: any[] = [];
    private logSubject = new Subject<any>();  // Subject for debouncing logs

    constructor(private firestore: Firestore) {
        this.fetchLogLengthFromFirestore();

        // Debounce the logs to avoid multiple rapid entries
        this.logSubject.pipe(debounceTime(500)).subscribe(() => {
            this.pushLogsToFirestore();
        });
    }

    // Fetch the log_length value from Firestore
    private async fetchLogLengthFromFirestore() {
        const docRef = doc(this.firestore, 'global_variables', 'logging_settings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            this.logLength = docSnap.data()['log_length'];
        }
    }

    // Log and get document from Firestore
    public async logAndGet(docRef: any, moduleName: string, collectionName: string, methodName: string) {
        const docSnap = await getDoc(docRef);  // Perform the actual Firestore read
        const log = {
            type: 'READ',
            module: moduleName,
            method: methodName,
            collection: collectionName,
            dataSize: docSnap.exists() ? JSON.stringify(docSnap.data()).length : 0,
            timestamp: new Date().toISOString(),
        };
        this.addLog(log);  // Add log to the list
        return docSnap;
    }

    // Log and set document to Firestore
    public async logAndSet(docRef: any, data: any, moduleName: string, collectionName: string, methodName: string) {
        await setDoc(docRef, data);  // Perform the actual Firestore write
        const log = {
            type: 'WRITE',
            module: moduleName,
            method: methodName,
            collection: collectionName,
            dataSize: JSON.stringify(data).length,
            timestamp: new Date().toISOString(),
        };
        this.addLog(log);  // Add log to the list
    }

    // Add logs and store them in localStorage
    public addLog(log: any) {
        this.logs.push(log);

        // Store the logs in localStorage every time a new log is added
        this.logToLocalStorage();

        // Check if the logs exceed the threshold in localStorage
        const storedLogs = JSON.parse(localStorage.getItem('firestoreLogs') || '[]');
        if (storedLogs.length >= this.logLength) {
            this.logSubject.next(null);  // Provide a dummy value to trigger log pushing
        }
    }

    // Store logs in localStorage
    private logToLocalStorage() {
        const existingLogs = JSON.parse(localStorage.getItem('firestoreLogs') || '[]');
        existingLogs.push(...this.logs);
        localStorage.setItem('firestoreLogs', JSON.stringify(existingLogs));
        this.logs = [];  // Clear in-memory logs after storing to localStorage
    }

    // Push logs to Firestore and clear localStorage
    private async pushLogsToFirestore() {
        const storedLogs = JSON.parse(localStorage.getItem('firestoreLogs') || '[]');
        if (storedLogs.length === 0) return;  // If no logs to push, return early

        const logRef = doc(this.firestore, `logs/${new Date().toISOString()}`);
        await setDoc(logRef, { logs: storedLogs });

        // Clear logs from localStorage after pushing
        localStorage.removeItem('firestoreLogs');
    }

    // Fetch and combine logs from Firestore
    public async fetchLogs(): Promise<any[]> {
        const logCollectionRef = collection(this.firestore, 'logs');
        const querySnapshot = await getDocs(logCollectionRef);

        // Combine all logs into a single array
        let combinedLogs: any[] = [];

        querySnapshot.forEach((doc) => {
            const logData = doc.data();
            if (logData['logs'] && Array.isArray(logData['logs'])) {
                combinedLogs = combinedLogs.concat(logData['logs']);
            }
        });

        return combinedLogs; // Return the combined array of logs
    }
}
