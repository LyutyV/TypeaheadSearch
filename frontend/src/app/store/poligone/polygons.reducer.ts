import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { MovieDetailsActions } from './polygons.actions';
import { IPolygon } from '../../interfaces/poligon.interface';

export interface PolygonState extends EntityState<IPolygon> {}

export const adapter = createEntityAdapter<IPolygon>({
    selectId: (polygon: IPolygon) => polygon.id,
});

export const initialState: PolygonState = adapter.getInitialState();

export const polygonReducer = createReducer(
    initialState,
    on(MovieDetailsActions.createPolygon, (state, { polygon }) => adapter.addOne(polygon, state)),
    on(MovieDetailsActions.addPoint, (state, { polygonId, point }) => {
        const polygon = state.entities[polygonId];
        if (!polygon) {
            return state;
        }
        const updatedPolygon = {
            ...polygon,
            points: [...polygon.points, point],
        };
        return adapter.updateOne({ id: polygonId, changes: updatedPolygon }, state);
    }),
    on(MovieDetailsActions.closeActivePolygon, (state, { color }) => {
        const activePolygon = Object.values(state.entities).find((p) => p && !p.color);
        if (!activePolygon) {
            return state;
        }
        const updatedPoints = activePolygon.points.length > 0 ? [...activePolygon.points, activePolygon.points[0]] : activePolygon.points;
        const updatedActivePolygon = {
            ...activePolygon,
            points: updatedPoints,
            color,
        };
        return adapter.updateOne({ id: activePolygon.id, changes: updatedActivePolygon }, state);
    }),
    on(MovieDetailsActions.updatePolygon, (state, { polygonId, changes }) => adapter.updateOne({ id: polygonId, changes }, state))
);
