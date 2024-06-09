import { Component, forwardRef, OnInit } from '@angular/core';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-ckeditor',
    standalone: true,
    templateUrl: './ckeditor.component.html',
    styleUrls: ['./ckeditor.component.scss'],
    imports: [CKEditorModule, FormsModule, CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CKEditorComponent),
            multi: true
        }
    ]
})
export class CKEditorComponent implements OnInit {
    public Editor: any;
    public editorData = '<p>Hello from CKEditor 5!</p>';

    public onChange: (value: string) => void = () => { };
    private onTouched: () => void = () => { };

    ngOnInit() {
        if (typeof window !== 'undefined') {
            import('@ckeditor/ckeditor5-build-classic').then((module) => {
                this.Editor = module.default;
            });
        }
    }

    writeValue(value: any): void {
        this.editorData = value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    onReady(editor: any) {
        editor.model.document.on('change:data', () => {
            const data = editor.getData();
            this.onChange(data);
        });
    }

}
