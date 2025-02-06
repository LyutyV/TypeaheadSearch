import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PolygonState, adapter } from './polygons.reducer';
import { IPolygon } from '../../interfaces/poligon.interface';

export const selectPolygonState = createFeatureSelector<PolygonState>('polygons');

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors(selectPolygonState);

export const selectPolygonsForMovie = (movieId: string) => createSelector(selectAll, (polygons: IPolygon[]) => polygons.filter((polygon) => polygon.movieId === movieId));
export const selectActivePolygonForMovie = (movieId: string) =>
    createSelector(selectPolygonsForMovie(movieId), (polygons: IPolygon[]) => polygons.find((polygon) => !polygon.color));
