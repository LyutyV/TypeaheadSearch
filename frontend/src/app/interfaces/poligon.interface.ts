import { IDot } from './dot.interface';

export interface IPolygon {
    id: string;
    points: IDot[];
    color?: string;
    movieId: string;
}
