import { Component } from '@angular/core';
import { Firestore, collection, query, where, getDocs, DocumentData, QuerySnapshot, updateDoc, doc, addDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Logger } from '../../logger.service'; // Import Logger service

@Component({
    selector: 'app-observation-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './observation-list.component.html',
    styleUrl: './observation-list.component.scss'
})
export class ObservationListComponent {
    observations: any[] = [];
    newObservation = '';
    pageUrl = '';
    normalizedPageUrl = '';
    expanded = false;

    constructor(private firestore: Firestore, private route: ActivatedRoute, private router: Router, private logger: Logger) { } // Inject Logger

    ngOnInit(): void {
        this.pageUrl = this.router.url; // Get the current page URL
        this.normalizedPageUrl = this.normalizeUrl(this.pageUrl); // Normalize the URL
        this.loadObservations();
    }

    normalizeUrl(url: string): string {
        const urlParts = url.split('/');
        const filteredParts = urlParts.filter(part => part !== '');

        if (filteredParts.length > 1) {
            return '/' + filteredParts.slice(0, -1).join('/');
        }
        return url;
    }

    async loadObservations(): Promise<void> {
        const col = collection(this.firestore, 'observations');
        const q = query(col, where('page', '==', this.normalizedPageUrl));

        // Log Firestore Read Operation
        this.logger.addLog({
            type: 'READ',
            module: 'ObservationListComponent',
            method: 'loadObservations',
            collection: 'observations',
            dataSize: 0, // You can adjust this value if you want to calculate the data size
            timestamp: new Date().toISOString(),
        });

        const snapshot = await getDocs(q);
        this.observations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    async addObservation(): Promise<void> {
        if (this.newObservation.trim()) {
            await addDoc(collection(this.firestore, 'observations'), {
                page: this.normalizedPageUrl,
                text: this.newObservation,
                completed: false
            });

            // Log Firestore Write Operation
            this.logger.addLog({
                type: 'WRITE',
                module: 'ObservationListComponent',
                method: 'addObservation',
                collection: 'observations',
                dataSize: this.newObservation.length, // Assuming the data size is the length of the observation text
                timestamp: new Date().toISOString(),
            });

            this.newObservation = '';
            this.loadObservations(); // Reload the observations
        }
    }

    async markAsCompleted(id: string): Promise<void> {
        const observationDoc = doc(this.firestore, 'observations', id);
        await updateDoc(observationDoc, { completed: true });

        // Log Firestore Write Operation
        this.logger.addLog({
            type: 'WRITE',
            module: 'ObservationListComponent',
            method: 'markAsCompleted',
            collection: `observations/${id}`,
            dataSize: 0, // If you want, you can adjust the size of the updated field
            timestamp: new Date().toISOString(),
        });

        this.loadObservations(); // Reload the observations
    }

    toggleList(): void {
        this.expanded = !this.expanded;
    }
}
