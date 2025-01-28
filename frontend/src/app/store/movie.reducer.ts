import { createReducer, on } from '@ngrx/store';
import { IMovieResponse } from '../interfaces/movieResponce.interface';
import { MoviesPageActions } from './movie.actions';

export interface MoviesState {
    cache: { [queryCache: string]: IMovieResponse }; // queryCache value consist of query string + ' ' + page number and responce is regular API responce
    loading: boolean;
}
export const initialMovieState: MoviesState = {
    cache: {},
    loading: false,
};

export const movieReducer = createReducer(
    initialMovieState,
    on(MoviesPageActions.searchMovies, (state) => {
        const newState = {
            ...state,
            loading: true, // just revert loading to true
        };
        return newState;
    }),
    on(MoviesPageActions.searchMoviesSuccess, (state, { queryCache, response }) => {
        const newState = {
            ...state,
            loading: false, // and revert loading to back to false
            cache: {
                ...state.cache,
                [queryCache]: response,
            },
        };
        return newState;
    }),
    on(MoviesPageActions.searchMoviesError, (state) => {
        const newState = {
            ...state,
            loading: false, // and revert loading to back to false
        };
        return newState;
    })
);
