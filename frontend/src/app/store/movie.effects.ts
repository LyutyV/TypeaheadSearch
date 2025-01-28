import { inject, Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, mergeMap, withLatestFrom } from 'rxjs/operators';
import { MoviesPageActions } from './movie.actions';
import { MoviesState } from './movie.reducer';
import { MovieService } from '../services/movie.service';
import { selectCache } from './movie.selectors';

@Injectable()
export class MovieEffects {
    private actions$ = inject(Actions);
    private movieService = inject(MovieService);
    private store = inject(Store<{ movies: MoviesState }>);
    constructor() {}

    loadMovies$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MoviesPageActions.searchMovies),
            withLatestFrom(this.store.select(selectCache)),
            mergeMap(([action, cachedMovies]) => {
                const queryCache = `${action.query}_${action.page}`;
                // if we have data already in cache, return it
                if (cachedMovies[queryCache]) {
                    return of(
                        MoviesPageActions.searchMoviesSuccess({
                            queryCache,
                            response: cachedMovies[queryCache],
                        })
                    );
                }
                // if we don't have data already in cache, ask the service
                return this.movieService.searchMovies(action.query, action.page).pipe(
                    map((response) => {
                        if (response.Response === 'False' && response.Error === 'Movie not found!') {
                            return MoviesPageActions.searchMoviesError({
                                error: response.Error,
                            });
                        }
                        return MoviesPageActions.searchMoviesSuccess({
                            queryCache,
                            response,
                        });
                    }),
                    catchError((error) => of(MoviesPageActions.searchMoviesError({ error: error.message })))
                );
            })
        )
    );
}
