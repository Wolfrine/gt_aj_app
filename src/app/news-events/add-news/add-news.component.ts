// add-news.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NewsService } from '../news-events.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { CustomizationService } from '../../customization.service';

import { CKEditorComponent } from '../ckeditor/ckeditor.component';

@Component({
    selector: 'app-add-news',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatDivider,
        CKEditorComponent
    ],
    templateUrl: './add-news.component.html',
    styleUrls: ['./add-news.component.scss']
})
export class AddNewsComponent implements OnInit {
    newsForm: FormGroup;
    maxLength = 150; // Maximum length for the title

    constructor(
        private fb: FormBuilder,
        private newsService: NewsService,
        private customizationService: CustomizationService
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

            console.log('CKEditor Content before submission:', contentHtml);

            if (newsData.image) {
                imageUrl = await this.newsService.uploadImage(newsData.image);
            }

            try {
                await this.newsService.addNews(this.customizationService.getSubdomainFromUrl(), {
                    title: newsData.title,
                    content: contentHtml,
                    imageUrl: imageUrl,
                    date: new Date()
                });
                this.newsForm.reset();
            } catch (error) {
                console.error('Error adding news:', error);
            }
        } else {
            console.warn('Form is invalid');
        }
    }
}
