import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'ordinal',
    standalone: true
})
export class OrdinalPipe implements PipeTransform {
    transform(value: number): string {
        const suffix = this.getOrdinalSuffix(value);
        return `${value}<sup>${suffix}</sup>`;
    }

    getOrdinalSuffix(i: number): string {
        const j = i % 10,
            k = i % 100;
        if (j === 1 && k !== 11) {
            return 'st';
        }
        if (j === 2 && k !== 12) {
            return 'nd';
        }
        if (j === 3 && k !== 13) {
            return 'rd';
        }
        return 'th';
    }
}
