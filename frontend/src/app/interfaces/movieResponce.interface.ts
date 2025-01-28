import { IMovie } from './movie.interface';

// if the response is True, then Search and Responce will be present
// if the response is False, then Error will be present

export type MovieResponce = 'True' | 'False';

export interface IMovieResponse {
    Response: MovieResponce;
    Search?: IMovie[];
    totalResults?: string;
    Error?: string;
}
