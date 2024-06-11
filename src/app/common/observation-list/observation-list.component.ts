import { Component } from '@angular/core';
import { Firestore, collection, query, where, getDocs, DocumentData, QuerySnapshot, updateDoc, doc, addDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
    expanded = false;

    constructor(private firestore: Firestore, private route: ActivatedRoute, private router: Router) { }

    ngOnInit(): void {
        this.pageUrl = this.router.url; // Get the current page URL
        this.loadObservations();
    }

    async loadObservations(): Promise<void> {
        const col = collection(this.firestore, 'observations');
        const q = query(col, where('page', '==', this.pageUrl));
        const snapshot = await getDocs(q);
        this.observations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    async addObservation(): Promise<void> {
        if (this.newObservation.trim()) {
            await addDoc(collection(this.firestore, 'observations'), {
                page: this.pageUrl,
                text: this.newObservation,
                completed: false
            });
            this.newObservation = '';
            this.loadObservations(); // Reload the observations
        }
    }

    async markAsCompleted(id: string): Promise<void> {
        const observationDoc = doc(this.firestore, 'observations', id);
        await updateDoc(observationDoc, { completed: true });
        this.loadObservations(); // Reload the observations
    }

    toggleList(): void {
        this.expanded = !this.expanded;
    }
}
