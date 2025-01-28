import { createActionGroup, props } from '@ngrx/store';
import { IMovieResponse } from '../interfaces/movieResponce.interface';

export const MoviesPageActions = createActionGroup({
    source: 'Movies',
    events: {
        SearchMovies: props<{ query: string; page: number }>(),
        SearchMoviesSuccess: props<{ queryCache: string; response: IMovieResponse }>(),
        SearchMoviesError: props<{ error: string }>(),
    },
});
