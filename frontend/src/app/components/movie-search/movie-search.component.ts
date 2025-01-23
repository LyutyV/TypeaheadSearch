import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { combineLatest, fromEvent, of, Subject } from 'rxjs';
import * as MovieActions from '../../store/movie.actions';
import { selectMovies, selectTotalResults, selectLoading, selectError, selectSuccessfulQueries } from '../../store/movie.selectors';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Movie } from '../../store/movie.reducer';

@Component({
    selector: 'app-movie-search',
    templateUrl: 'movie-search.component.html',
    styleUrls: ['movie-search.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ScrollingModule, ReactiveFormsModule],
})
export class MovieSearchComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('viewport', { read: ElementRef }) viewport: ElementRef<HTMLElement> | undefined;
    searchControl = new FormControl();
    movies: Movie[] = [];
    successfulQueries: string[] = [];
    totalResults = 0;
    loading$;
    error$;
    lastQuery = '';
    private destroy$ = new Subject<void>();
    private loadedPages = new Set<number>();

    constructor(private store: Store) {
        this.loading$ = this.store.select(selectLoading);
        this.error$ = this.store.select(selectError(this.lastQuery));
        this.store
            .select(selectSuccessfulQueries)
            .pipe(takeUntil(this.destroy$))
            .subscribe((queries) => {
                this.successfulQueries = queries;
            });
    }
    ngAfterViewInit(): void {
        fromEvent(this.viewport!.nativeElement, 'scroll')
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                // Find last real movie index
                const lastRealMovieIndex = this.movies.reduce((acc, movie, index) => (movie !== null ? index : acc), -1);

                if (lastRealMovieIndex === -1) return;

                // Get viewport bottom position
                const viewportRect = this.viewport!.nativeElement.getBoundingClientRect();
                const viewportBottom = viewportRect.bottom;

                // Get last real movie element position
                const movieElements = this.viewport!.nativeElement.getElementsByClassName('movie-item');
                const lastRealMovieElement = movieElements[lastRealMovieIndex];
                const lastMovieBottom = lastRealMovieElement.getBoundingClientRect().bottom;

                // Calculate distance
                const distanceToBottom = lastMovieBottom - viewportBottom;

                if (distanceToBottom < 200 && lastRealMovieIndex + 1 < this.totalResults) {
                    const pageSize = 10;
                    const currentPage = Math.floor((lastRealMovieIndex + 1) / pageSize) + 1;

                    if (!this.loadedPages.has(currentPage)) {
                        this.loadedPages.add(currentPage);
                        this.store.dispatch(
                            MovieActions.searchMovies({
                                query: this.lastQuery,
                                page: currentPage,
                            })
                        );
                    }
                }
            });
    }

    ngOnInit(): void {
        this.initializeSearchSubscription();
    }

    private initializeSearchSubscription(): void {
        this.searchControl.valueChanges
            .pipe(
                debounceTime(500),
                distinctUntilChanged(),
                switchMap((query) => this.handleSearchQuery(query)),
                takeUntil(this.destroy$)
            )
            .subscribe(([movies, totalResults]) => this.updateMoviesList(movies, totalResults));
    }

    private handleSearchQuery(query: string) {
        if (query && query !== this.lastQuery) {
            this.lastQuery = query;
            this.loadedPages.clear();
            this.viewport?.nativeElement.scrollTo(0, 0);
            this.store.dispatch(MovieActions.searchMovies({ query, page: 1 }));
            this.error$ = this.store.select(selectError(query));
        }
        return combineLatest([this.store.select(selectMovies(query)), this.store.select(selectTotalResults(query))]);
    }

    private updateMoviesList(movies: Movie[] | null, totalResults: number): void {
        if (!movies) return;

        if (this.totalResults !== totalResults) {
            this.initializeMoviesArray(totalResults);
        }

        this.updateMoviePositions(movies);
    }

    private initializeMoviesArray(totalResults: number): void {
        this.totalResults = totalResults;
        this.movies = new Array(Math.min(totalResults, 100)).fill(null);
    }

    private updateMoviePositions(movies: Movie[]): void {
        movies.forEach((movie, index) => {
            if (this.movies[index]?.imdbID !== movie.imdbID) {
                this.movies[index] = { ...movie };
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    trackByFn(index: number, movie: any): string {
        return movie ? movie.imdbID : index;
    }
}
