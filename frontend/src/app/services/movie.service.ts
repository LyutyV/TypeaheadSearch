import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MovieService {
    private apiUrl = 'https://movie-database-alternative.p.rapidapi.com';
    private rapidApiKey = '1a3d6dc12amshaf7b6d62ef02951p1a121ajsnf87b81dd4ea4';
    private rapidApiHost = 'movie-database-alternative.p.rapidapi.com';
    private placeholderPoster = 'https://via.assets.so/movie.png?id=2&w=80&h=100';

    constructor(private http: HttpClient) {}

    searchMovies(query: string, page: number): Observable<any> {
        const headers = new HttpHeaders({
            'x-rapidapi-key': this.rapidApiKey,
            'x-rapidapi-host': this.rapidApiHost,
        });

        return this.http
            .get<any>(this.apiUrl, {
                headers: headers,
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
