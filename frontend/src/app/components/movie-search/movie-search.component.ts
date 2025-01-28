import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ViewChild, AfterViewInit, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { combineLatest, fromEvent, Observable, of, Subject } from 'rxjs';
import { MoviesPageActions } from '../../store/movie.actions';
import { selectTotalResults, selectLoadingStatus, selectSuccessfulQueries, selectMoviesFromCache } from '../../store/movie.selectors';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { IMovie } from '../../interfaces/movie.interface';

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
    movies: IMovie[] = [];
    successfulQueries: string[] = [];
    totalResults = 0;
    loading$;
    lastQuery = '';
    private destroy$ = new Subject<void>();
    private loadedPages = new Set<number>();

    constructor(private store: Store, private cd: ChangeDetectorRef) {
        this.loading$ = this.store.select(selectLoadingStatus);
        this.store
            .select(selectSuccessfulQueries)
            .pipe(takeUntil(this.destroy$))
            .subscribe((queries) => {
                this.successfulQueries = queries;
            });
    }
    ngAfterViewInit(): void {
        // Subscribe to scroll
        fromEvent(this.viewport!.nativeElement, 'scroll')
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                // Find last real movie index
                const lastRealMovieIndex = this.movies.reduce((acc, movie, index) => (movie !== null ? index : acc), -1);

                if (lastRealMovieIndex === -1) return;

                // Get movies area bottom position
                const viewportRect = this.viewport!.nativeElement.getBoundingClientRect();
                const viewportBottom = viewportRect.bottom;

                // Get last real movie element position
                const movieElements = this.viewport!.nativeElement.getElementsByClassName('movie-item');
                const lastRealMovieElement = movieElements[lastRealMovieIndex];
                const lastMovieBottom = lastRealMovieElement.getBoundingClientRect().bottom;

                // Calculate distance between last movie and bottom of movies area
                const distanceToBottom = lastMovieBottom - viewportBottom;

                if (distanceToBottom < 200 && lastRealMovieIndex + 1 < this.totalResults) {
                    const pageSize = 10;
                    const currentPage = Math.floor((lastRealMovieIndex + 1) / pageSize) + 1;

                    if (!this.loadedPages.has(currentPage)) {
                        this.loadedPages.add(currentPage);
                        this.store.dispatch(
                            MoviesPageActions.searchMovies({
                                query: this.lastQuery,
                                page: currentPage,
                            })
                        );
                    }
                }
            });
    }

    ngOnInit(): void {
        this.searchControl.valueChanges
            .pipe(
                debounceTime(500),
                distinctUntilChanged(),
                switchMap((query) => this.handleQuery(query)),
                takeUntil(this.destroy$)
            )
            .subscribe(([movies, totalResults]) => this.updateMoviesList(movies, totalResults));
    }

    private handleQuery(query: string): Observable<[IMovie[], number]> {
        // if query is empty, clear movies list
        if (!query) {
            this.movies = [];
            this.lastQuery = '';
            this.cd.markForCheck();
            return of([[], 0]);
        }

        if (query !== this.lastQuery) {
            this.lastQuery = query;
            this.loadedPages.clear();
            this.viewport?.nativeElement.scrollTo(0, 0);
            this.store.dispatch(MoviesPageActions.searchMovies({ query, page: 1 }));
        }
        // at this stage responce is already in the cache so we can update movies list
        return combineLatest([this.store.select(selectMoviesFromCache(query)), this.store.select(selectTotalResults(query))]);
    }

    private updateMoviesList(movies: IMovie[], totalResults: number): void {
        if (!movies) return;

        // if totalResults changed, that means we have a new search query
        if (this.totalResults !== totalResults) {
            this.renewMoviesArray(totalResults);
        }

        this.updateMoviesArray(movies);
    }

    private renewMoviesArray(totalResults: number): void {
        this.totalResults = totalResults;
        // fill array of either 100 elements to avoid overloading page or totalResults if it's less than 100
        this.movies = new Array(Math.min(totalResults, 100)).fill(null);
    }

    private updateMoviesArray(movies: IMovie[]): void {
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
