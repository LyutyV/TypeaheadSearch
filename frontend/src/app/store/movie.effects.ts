import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, mergeMap, withLatestFrom } from 'rxjs/operators';
import { MovieService } from '../services/movie.service';
import * as MovieActions from './movie.actions';
import { selectMovieState } from './movie.selectors';

@Injectable()
export class MovieEffects {
    private actions$ = inject(Actions);
    private movieService = inject(MovieService);
    private store = inject(Store);

    searchMovies$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MovieActions.searchMovies),
            withLatestFrom(this.store.select(selectMovieState)),
            mergeMap(([{ query, page }, movieState]) => {
                const queryCache = movieState.cache[query];

                if (queryCache) {
                    if (queryCache.error) {
                        // Return cached error
                        return of(MovieActions.searchMoviesFailure({ query, error: queryCache.error }));
                    }
                    if (queryCache.empty) {
                        // Return cached empty result
                        return of(MovieActions.searchMoviesEmpty({ query, page }));
                    }
                    if (queryCache.pages[page]) {
                        // Return cached page
                        return of(
                            MovieActions.searchMoviesSuccess({
                                query,
                                page,
                                movies: queryCache.pages[page],
                                totalResults: queryCache.totalResults,
                            })
                        );
                    }
                }

                // Backend request
                return this.movieService.searchMovies(query, page).pipe(
                    map((response) => {
                        if (response.Search && response.Search.length > 0) {
                            return MovieActions.searchMoviesSuccess({
                                query,
                                page,
                                movies: response.Search,
                                totalResults: parseInt(response.totalResults, 10),
                            });
                        } else {
                            return MovieActions.searchMoviesEmpty({ query, page });
                        }
                    }),
                    catchError((error) =>
                        of(
                            MovieActions.searchMoviesFailure({
                                query,
                                error: error.message || 'An error occurred',
                            })
                        )
                    )
                );
            })
        )
    );
}