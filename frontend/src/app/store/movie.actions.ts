import { createActionGroup, props } from '@ngrx/store';
import { Movie } from './movie.reducer';

export const MoviesPageActions = createActionGroup({
    source: 'Movies',
    events: {
        SearchMovies: props<{ query: string; page: number }>(),

        SearchMoviesSuccess: props<{ query: string; page: number; movies: Movie[]; totalResults: number }>(),

        SearchMoviesFailure: props<{ query: string; error: string }>(),

        SearchMoviesEmpty: props<{ query: string; page: number }>(),
    },
});
