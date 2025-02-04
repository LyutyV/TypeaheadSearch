import { createSelector, createFeatureSelector } from '@ngrx/store';
import { MoviesState } from './movie.reducer';
import { IMovie } from '../interfaces/movie.interface';

export const selectMovieState = createFeatureSelector<MoviesState>('movies');

export const selectCache = createSelector(selectMovieState, (state: MoviesState) => state.cache);

export const selectLoadingStatus = createSelector(selectMovieState, (state: MoviesState) => state.loading);

export const selectMoviesFromCache = (query: string) =>
    createSelector(selectCache, (cache) => {
        const movies: IMovie[] = [];
        for (const key in cache) {
            // get rid of the page number in the query to compare
            if (key.split('_')[0] === query) {
                const results = cache[key].Search;
                if (results) {
                    movies.push(...results);
                }
            }
        }
        return movies;
    });

export const selectTotalResults = (query: string) =>
    createSelector(selectCache, (cache) => {
        for (const key in cache) {
            if (key.split('_')[0] === query) {
                const totalResults = cache[key].totalResults;
                if (totalResults) {
                    return parseInt(totalResults);
                }
            }
        }
        return 0;
    });

export const selectSuccessfulQueries = createSelector(selectCache, (cache) => {
    // get rid of the page number in the query and return array of unique queries
    const queries = new Set<string>();
    Object.keys(cache).forEach((queryCache) => {
        const query = queryCache.split('_')[0];
        queries.add(query);
    });
    return Array.from(queries);
});
