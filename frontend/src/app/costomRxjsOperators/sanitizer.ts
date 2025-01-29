import { Observable } from 'rxjs';

export function sanitize<T extends string>(source: Observable<T>): Observable<T> {
    return new Observable<T>((observer) => {
        const subscription = source.subscribe({
            next(value: T) {
                const sanitizedValue = value.replace(/[<>"'&]/g, '');
                const noDoubleSpaces = sanitizedValue.replace(/\s+/g, ' ');
                observer.next(noDoubleSpaces as T);
            },
            error(err) {
                observer.error(err);
            },
            complete() {
                observer.complete();
            },
        });

        return () => subscription.unsubscribe();
    });
}
