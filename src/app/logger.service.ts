import { Firestore, doc, getDoc, setDoc, collection, getDocs } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class Logger {
    private logLength: number = 100;  // Default if fetching fails
    private logs: any[] = [];
    private logSubject = new Subject<any>();

    // Toggle flag to enable/disable logging
    private loggingEnabled: boolean = true;  // Set to false if you want logging off by default

    constructor(private firestore: Firestore) {
        this.fetchLogLengthFromFirestore();

        // Debounce the logs to avoid multiple rapid entries
        this.logSubject.pipe(debounceTime(500)).subscribe(() => {
            if (this.loggingEnabled) {  // Only push logs if logging is enabled
                this.pushLogsToFirestore();
            }
        });
    }

    // Method to toggle logging on or off
    public setLoggingEnabled(enabled: boolean): void {
        this.loggingEnabled = enabled;
    }

    // Fetch log length value from Firestore
    private async fetchLogLengthFromFirestore() {
        if (!this.loggingEnabled) return;  // Skip fetching if logging is disabled
        const docRef = doc(this.firestore, 'global_variables', 'logging_settings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            this.logLength = docSnap.data()['log_length'];
        }
    }

    // Log and get document from Firestore
    public async logAndGet(docRef: any, moduleName: string, collectionName: string, methodName: string) {
        const result = await getDoc(docRef);  // Perform Firestore read
        if (!this.loggingEnabled) {
            return result;  // Skip logging if disabled
        }

        const log = {
            type: 'READ',
            module: moduleName,
            method: methodName,
            collection: collectionName,
            dataSize: result.exists() ? JSON.stringify(result.data()).length : 0,
            timestamp: new Date().toISOString(),
        };
        this.addLog(log);  // Add log to list
        return result;
    }

    // Log and set document to Firestore
    public async logAndSet(docRef: any, data: any, moduleName: string, collectionName: string, methodName: string) {
        await setDoc(docRef, data);  // Perform Firestore write
        if (!this.loggingEnabled) {
            return;  // Skip logging if disabled
        }

        const log = {
            type: 'WRITE',
            module: moduleName,
            method: methodName,
            collection: collectionName,
            dataSize: JSON.stringify(data).length,
            timestamp: new Date().toISOString(),
        };
        this.addLog(log);  // Add log to list
    }

    // Add logs and store in localStorage
    public addLog(log: any) {
        if (!this.loggingEnabled) {
            return;  // Skip adding log if disabled
        }
        this.logs.push(log);

        // Store logs in localStorage every time a new log is added
        this.logToLocalStorage();

        // Check if logs exceed threshold
        const storedLogs = JSON.parse(localStorage.getItem('firestoreLogs') || '[]');
        if (storedLogs.length >= this.logLength) {
            this.logSubject.next(null);  // Trigger log push
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
        if (storedLogs.length === 0) return;

        const logRef = doc(this.firestore, `logs/${new Date().toISOString()}`);
        await setDoc(logRef, { logs: storedLogs });

        // Clear logs from localStorage after pushing
        localStorage.removeItem('firestoreLogs');
    }

    // Fetch and combine logs from Firestore
    public async fetchLogs(): Promise<any[]> {
        if (!this.loggingEnabled) {
            return [];  // Skip fetching if logging is disabled
        }

        const logCollectionRef = collection(this.firestore, 'logs');
        const querySnapshot = await getDocs(logCollectionRef);
        let combinedLogs: any[] = [];

        querySnapshot.forEach((doc) => {
            const logData = doc.data();
            if (logData['logs'] && Array.isArray(logData['logs'])) {
                combinedLogs = combinedLogs.concat(logData['logs']);
            }
        });

        return combinedLogs;
    }
}
