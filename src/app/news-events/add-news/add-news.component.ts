// add-news.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NewsService } from '../news-events.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';

@Component({
    selector: 'app-add-news',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatDivider
    ],
    templateUrl: './add-news.component.html',
    styleUrls: ['./add-news.component.scss']
})
export class AddNewsComponent implements OnInit {
    newsForm: FormGroup;
    maxLength = 150; // Maximum length for the title

    constructor(
        private fb: FormBuilder,
        private newsService: NewsService
    ) {
        this.newsForm = this.fb.group({
            title: [''],
            content: [''],
            image: [null]
        });
    }

    ngOnInit() {
    }

    onFileSelected(event: any) {
        this.newsForm.patchValue({
            image: event.target.files[0]
        });
    }

    get remainingChars(): number {
        return this.maxLength - (this.newsForm.get('title')?.value.length || 0);
    }

    async onSubmit() {
        if (this.newsForm.valid) {
            const newsData = this.newsForm.value;
            const contentHtml = newsData.content; // This contains the HTML content from CKEditor

            let imageUrl = '';

            if (newsData.image) {
                imageUrl = await this.newsService.uploadImage(newsData.image);
            }

            this.newsService.addNews('instituteId', {
                title: newsData.title,
                content: contentHtml,
                imageUrl: imageUrl,
                date: new Date()
            }).then(() => {
                this.newsForm.reset();
            });
        }
    }
}
