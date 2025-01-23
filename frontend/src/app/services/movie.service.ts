import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MovieService {
    private apiUrl = 'https://movie-database-alternative.p.rapidapi.com';
    private placeholderPoster = 'https://via.assets.so/movie.png?id=2&w=80&h=100';

    constructor(private http: HttpClient) {}

    searchMovies(query: string, page: number): Observable<any> {
        // Headers are added by the interceptor

        return this.http
            .get<any>(this.apiUrl, {
                params: {
                    s: query,
                    r: 'json',
                    page: page.toString(),
                },
            })
            .pipe(
                map((response) => {
                    if (response?.Search) {
                        response.Search = response.Search.map((movie: any) => ({
                            ...movie,
                            Poster: movie.Poster === 'N/A' ? this.placeholderPoster : movie.Poster,
                        }));
                    }
                    return response;
                }),
                catchError((error) => {
                    console.error('API Error:', error);
                    return throwError(() => new Error('Failed to fetch movies.'));
                })
            );
    }
}
