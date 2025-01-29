import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'highlight',
})
export class HighlightSearchPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}

    transform(value: string, query: string): SafeHtml {
        // here we find all words from query in value (movie title) and wrap them in <mark> tag
        if (!query) {
            return value;
        }
        const words = query.trim().split(' ');
        let result = value;
        words.forEach((word) => {
            const re = new RegExp(word, 'gi');
            result = result.replace(re, (match) => `<mark>${match}</mark>`);
        });
        return this.sanitizer.bypassSecurityTrustHtml(result);
    }
}
