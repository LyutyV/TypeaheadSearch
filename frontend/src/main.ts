import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { MovieSearchComponent } from './app/components/movie-search/movie-search.component';

bootstrapApplication(MovieSearchComponent, appConfig).catch((err) => console.error(err));
