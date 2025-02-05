import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideState, provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { movieReducer } from './store/movie.reducer';
import { MovieEffects } from './store/movie.effects';
import { movieApiInterceptor } from './interceptors/movie-api.interceptor';
import { logger } from './store/meta-reducer';
import { polygonReducer } from './store/poligone/polygons.reducer';
import { provideStoreDevtools } from '@ngrx/store-devtools';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideStore({}, { metaReducers: [logger] }),
        provideState({ name: 'movies', reducer: movieReducer }),
        provideState({ name: 'polygons', reducer: polygonReducer }),
        provideEffects(MovieEffects),
        provideHttpClient(withInterceptors([movieApiInterceptor])),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideStoreDevtools({
            maxAge: 25,
        }),
    ],
};
