import { createSelector } from '@ngrx/store';
import { Movie, MovieState } from './movie.reducer';

export const selectMovieState = (state: any) => state.movies;

export const selectMovies = (query: string) =>
    createSelector(selectMovieState, (state: MovieState) => {
        const queryCache = state.cache[query];
        if (!queryCache || !Object.keys(queryCache.pages).length) return [];

        const allMovies: Movie[] = [];
        Object.values(queryCache.pages).forEach((pageMovies) => {
            allMovies.push(...pageMovies);
        });
        return allMovies;
    });

export const selectTotalResults = (query: string) => createSelector(selectMovieState, (state: MovieState) => state.cache[query]?.totalResults || 0);

export const selectLoading = createSelector(selectMovieState, (state: MovieState) => state.loading);

export const selectError = (query: string) => createSelector(selectMovieState, (state: MovieState) => state.cache[query]?.error || null);

export const selectIsQueryEmpty = (query: string) => createSelector(selectMovieState, (state: MovieState) => state.cache[query]?.empty || false);

export const selectSuccessfulQueries = createSelector(selectMovieState, (state: MovieState) => {
    if (!state.cache || !Object.keys(state.cache).length) return [];
    return Object.keys(state.cache).filter((query) => !state.cache[query].empty && !state.cache[query].error);
});
