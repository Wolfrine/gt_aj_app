import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class CKEditorLoaderService {
    private isCKEditorLoaded = false;

    async loadCKEditor(): Promise<any> {
        if (this.isCKEditorLoaded) {
            return (window as any).ClassicEditor;
        }

        if (typeof window !== 'undefined') {
            const { default: ClassicEditor } = await import('@ckeditor/ckeditor5-build-classic');
            (window as any).ClassicEditor = ClassicEditor;
            this.isCKEditorLoaded = true;
            return ClassicEditor;
        }
    }
}
