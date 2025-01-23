import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideHttpClient } from '@angular/common/http';
import { movieReducer } from './store/movie.reducer';
import { MovieEffects } from './store/movie.effects';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideStore({ movies: movieReducer }),
        provideEffects(MovieEffects),
        provideHttpClient(),
        provideZoneChangeDetection({ eventCoalescing: true }),
    ],
};
