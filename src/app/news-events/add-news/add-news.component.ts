import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NewsService } from '../news-events.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import { CKEditorLoaderService } from '../ckeditor-loader.service';

@Component({
    selector: 'app-add-news',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './add-news.component.html',
    styleUrls: ['./add-news.component.scss']
})
export class AddNewsComponent {
    newsForm: FormGroup;
    public Editor: any;

    constructor(
        private fb: FormBuilder,
        private newsService: NewsService,
        private storage: AngularFireStorage,
        private ckeditorLoader: CKEditorLoaderService
    ) {
        this.newsForm = this.fb.group({
            title: [''],
            content: [''],
            image: [null]
        });
    }

    async ngOnInit() {
        console.log('NewsEventsComponent init');
        if (typeof window !== 'undefined') {

            // Load CKEditor using the service
            this.Editor = await this.ckeditorLoader.loadCKEditor();
        }
    }

    onSubmit() {
        if (this.newsForm.valid) {
            const newsData = this.newsForm.value;
            const contentHtml = newsData.content; // This contains the HTML content from CKEditor

            this.newsService.addNews('instituteId', {
                title: newsData.title,
                content: contentHtml,
                date: new Date()
            }).then(() => {
                this.newsForm.reset();
            });
        }
    }
}
