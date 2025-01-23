import { createReducer, on } from '@ngrx/store';
import * as MovieActions from './movie.actions';

export interface Movie {
    imdbID: string;
    Title: string;
    Year: number;
    Type: string;
    Poster: string;
}

export interface MovieState {
    cache: {
        [query: string]: {
            totalResults: number;
            pages: { [page: number]: Movie[] };
            error?: string; // Cache server errors like 500
            empty?: boolean; // Cache empty results
        };
    };
    loading: boolean;
    error: string | null;
}

const initialState: MovieState = {
    cache: {},
    loading: false,
    error: null,
};

export const movieReducer = createReducer(
    initialState,
    on(MovieActions.searchMovies, (state) => ({
        ...state,
        loading: true,
        error: null,
    })),
    on(MovieActions.searchMoviesSuccess, (state, { query, page, movies, totalResults }) => {
        const queryCache = state.cache[query] || { totalResults: 0, pages: {} };
        return {
            ...state,
            cache: {
                ...state.cache,
                [query]: {
                    ...queryCache,
                    totalResults: totalResults,
                    pages: {
                        ...queryCache.pages,
                        [page]: movies,
                    },
                    empty: movies.length === 0, // Mark as empty if no movies
                },
            },
            loading: false,
        };
    }),
    on(MovieActions.searchMoviesFailure, (state, { query, error }) => {
        const queryCache = state.cache[query] || { totalResults: 0, pages: {} };
        return {
            ...state,
            cache: {
                ...state.cache,
                [query]: {
                    ...queryCache,
                    error, // Cache the error
                },
            },
            loading: false,
        };
    }),
    on(MovieActions.searchMoviesEmpty, (state, { query, page }) => {
        const queryCache = state.cache[query] || { totalResults: 0, pages: {} };
        return {
            ...state,
            cache: {
                ...state.cache,
                [query]: {
                    ...queryCache,
                    pages: {
                        ...queryCache.pages,
                        [page]: [],
                    },
                    empty: true, // Mark as empty
                },
            },
            loading: false,
        };
    })
);
