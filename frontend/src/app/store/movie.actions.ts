import { createAction, props } from '@ngrx/store';
import { Movie } from './movie.reducer';

export const searchMovies = createAction('[Movies] Search Movies', props<{ query: string; page: number }>());

export const searchMoviesSuccess = createAction('[Movies] Search Movies Success', props<{ query: string; page: number; movies: Movie[]; totalResults: number }>());

export const searchMoviesFailure = createAction('[Movies] Search Movies Failure', props<{ query: string; error: string }>());

export const searchMoviesEmpty = createAction('[Movies] Search Movies Empty', props<{ query: string; page: number }>());
