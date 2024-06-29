import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MarkdownService {
    private baseUrl = 'https://raw.githubusercontent.com/Wolfrine/GrowthWebsite/main/documentation/';

    constructor(private http: HttpClient) { }

    fetchMarkdownFile(filePath: string): Observable<string> {
        return this.http.get(`${this.baseUrl}${filePath}`, { responseType: 'text' });
    }
}
