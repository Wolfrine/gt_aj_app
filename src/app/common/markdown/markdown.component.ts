import { Component, OnInit, AfterViewChecked, Renderer2 } from '@angular/core';
import { MarkdownService } from './markdown.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as showdown from 'showdown';
import { Location } from '@angular/common';

@Component({
    selector: 'app-markdown',
    templateUrl: './markdown.component.html',
    styleUrls: ['./markdown.component.scss'],
    standalone: true,
    providers: [MarkdownService],
})
export class MarkdownComponent implements OnInit, AfterViewChecked {
    markdownContent: SafeHtml = '';

    constructor(
        private markdownService: MarkdownService,
        private sanitizer: DomSanitizer,
        private location: Location,
        private renderer: Renderer2
    ) { }

    ngOnInit(): void {
        const initialFile = this.getHash() || 'overview.md';
        this.loadMarkdownFile(initialFile);
    }

    ngAfterViewChecked(): void {
        this.applyStyles();
    }

    loadMarkdownFile(filePath: string): void {
        this.markdownService.fetchMarkdownFile(filePath).subscribe((data) => {
            const converter = new showdown.Converter();
            const html = converter.makeHtml(data);
            this.markdownContent = this.sanitizer.bypassSecurityTrustHtml(html);
            this.updateHash(filePath);
            setTimeout(() => this.applyStyles(), 0); // Ensure styles are applied after content is loaded
        });
    }

    onLinkClick(event: MouseEvent): void {
        const target = event.target as HTMLAnchorElement;
        if (target.tagName === 'A' && target.getAttribute('href')) {
            event.preventDefault();
            const filePath = target.getAttribute('href')!;
            this.loadMarkdownFile(filePath);
        }
    }

    private updateHash(filePath: string): void {
        this.location.replaceState(`documentation#${filePath}`);
    }

    private getHash(): string | null {
        return window.location.hash ? window.location.hash.substring(1) : null;
    }

    private applyStyles(): void {
        const elements = document.querySelectorAll('h1');
        elements.forEach(el => {
            this.renderer.setStyle(el, 'border-bottom', '1px solid #d2d4d7');
            this.renderer.setStyle(el, 'padding-bottom', '0.4em');
            this.renderer.setStyle(el, 'margin-bottom', '0.9em');
        });

        const elements2 = document.querySelectorAll('h2');
        elements2.forEach(el => {
            this.renderer.setStyle(el, 'border-bottom', '1px solid #eaecef');
            this.renderer.setStyle(el, 'padding-bottom', '0.3em');
            this.renderer.setStyle(el, 'margin-bottom', '0.5em');
        });
    }
}
