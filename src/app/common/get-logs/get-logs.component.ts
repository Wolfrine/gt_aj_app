import { Component, OnInit } from '@angular/core';
import { Logger } from '../../logger.service'; // Assuming logger.service.ts is at the parent folder level
import { CommonModule } from '@angular/common';

@Component({
    selector: 'get-logs',
    templateUrl: './get-logs.component.html',
    styleUrls: ['./get-logs.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class GetLogsComponent implements OnInit {

    logs: any[] = [];

    constructor(private loggerService: Logger) { }

    ngOnInit(): void {
        // Fetch logs when component initializes
        this.fetchLogs();
    }

    fetchLogs() {
        this.loggerService.fetchLogs().then(fetchedLogs => {
            this.logs = fetchedLogs;
        }).catch(error => {
            console.error('Error fetching logs: ', error);
        });
    }

    downloadLogsAsJson() {
        if (this.logs.length > 0) {
            const jsonString = JSON.stringify(this.logs, null, 2); // Format logs to JSON
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);

            // Create a temporary anchor element to trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = 'logs.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a); // Clean up
        } else {
            console.warn('No logs to download');
        }
    }
}
