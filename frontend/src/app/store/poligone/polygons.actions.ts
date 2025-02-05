import { createActionGroup, props } from '@ngrx/store';
import { IDot } from '../../interfaces/dot.interface';
import { IPolygon } from '../../interfaces/poligon.interface';

export const MovieDetailsActions = createActionGroup({
    source: 'Polygon',
    events: {
        createPolygon: props<{ polygon: IPolygon }>(),
        addPoint: props<{ polygonId: string; point: IDot }>(),
        closeActivePolygon: props<{ color: string }>(),
        updatePolygon: props<{ polygonId: string; changes: Partial<IPolygon> }>(),
    },
});
