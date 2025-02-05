import { Component, AfterViewInit, ChangeDetectorRef, ElementRef, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { IMovie } from '../../interfaces/movie.interface';
import { selectActivePolygonForMovie, selectPolygonsForMovie } from '../../store/poligone/polygons.selectors';
import { MovieDetailsActions } from '../../store/poligone/polygons.actions';
import { IPolygon } from '../../interfaces/poligon.interface';

@Component({
    selector: 'app-movie-details',
    templateUrl: './movie-details.component.html',
    styleUrls: ['./movie-details.component.scss'],
})
export class MovieDetailsComponent implements AfterViewInit {
    @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
    @Output() close = new EventEmitter<void>();

    private canvasContext!: CanvasRenderingContext2D;
    movie: IMovie | null = null;
    private backgroundImage!: HTMLImageElement;

    constructor(private cd: ChangeDetectorRef, private store: Store) {}

    closeDetails(): void {
        this.close.emit();
    }

    ngAfterViewInit(): void {
        const canvasEl = this.canvas.nativeElement;
        this.canvasContext = canvasEl.getContext('2d')!;
        canvasEl.width = canvasEl.offsetWidth;
        canvasEl.height = canvasEl.offsetHeight;
        this.loadBackgroundImage();

        if (this.movie) {
            this.store.select(selectPolygonsForMovie(this.movie.imdbID)).subscribe((polygons: IPolygon[]) => {
                this.draw(polygons);
            });
        }
    }

    private loadBackgroundImage(): void {
        if (this.movie && this.movie.Poster) {
            const img = new Image();
            img.onload = () => {
                this.backgroundImage = img;
                if (this.movie) {
                    this.store
                        .select(selectPolygonsForMovie(this.movie.imdbID))
                        .pipe(take(1))
                        .subscribe((polygons: IPolygon[]) => this.draw(polygons));
                }
            };
            img.src = this.movie.Poster;
        }
    }

    onCanvasClick(event: MouseEvent): void {
        const rect = this.canvas.nativeElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.movie) {
            this.store
                .select(selectActivePolygonForMovie(this.movie.imdbID))
                .pipe(take(1))
                .subscribe((activePolygon: IPolygon | undefined) => {
                    if (!activePolygon) {
                        const newPolygonId = Math.random().toString();
                        const newPolygon: IPolygon = {
                            id: newPolygonId,
                            points: [{ x, y }],
                            movieId: this.movie!.imdbID,
                        };
                        this.store.dispatch(MovieDetailsActions.createPolygon({ polygon: newPolygon }));
                    } else {
                        if (activePolygon.points.length > 0 && this.isClickOnFirstPoint(activePolygon.points, x, y)) {
                            const color = this.getRandomColor();
                            this.store.dispatch(MovieDetailsActions.closeActivePolygon({ color }));
                        } else {
                            this.store.dispatch(MovieDetailsActions.addPoint({ polygonId: activePolygon.id, point: { x, y } }));
                        }
                    }
                });
        }
        this.cd.markForCheck();
    }

    private isClickOnFirstPoint(points: { x: number; y: number }[], x: number, y: number): boolean {
        const firstPoint = points[0];
        const distance = Math.hypot(firstPoint.x - x, firstPoint.y - y);
        return distance < 10;
    }

    private getRandomColor(): string {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        const a = 0.3;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    private draw(polygons: IPolygon[]): void {
        if (!this.backgroundImage) return;
        const ctx = this.canvasContext;
        ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

        polygons.forEach((polygonData) => {
            const polygon = polygonData.points;
            if (polygon.length === 0) return;

            ctx.beginPath();
            polygon.forEach((point, i) => {
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });

            if (polygon.length > 2 && polygon[0].x === polygon[polygon.length - 1].x && polygon[0].y === polygon[polygon.length - 1].y) {
                ctx.closePath();
                ctx.fillStyle = polygonData.color || 'rgba(0, 255, 0, 0.3)';
                ctx.fill();
            }

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.stroke();

            polygon.forEach((point) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = 'green';
                ctx.fill();
            });
        });
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: Event): void {
        const canvasEl = this.canvas.nativeElement;
        const oldWidth = canvasEl.width;
        const oldHeight = canvasEl.height;

        canvasEl.width = canvasEl.offsetWidth;
        canvasEl.height = canvasEl.offsetHeight;

        const scaleX = canvasEl.width / oldWidth;
        const scaleY = canvasEl.height / oldHeight;

        if (this.movie) {
            this.store
                .select(selectPolygonsForMovie(this.movie.imdbID))
                .pipe(take(1))
                .subscribe((polygons: IPolygon[]) => {
                    polygons.forEach((polygonData) => {
                        const newPoints = polygonData.points.map((point) => ({
                            x: point.x * scaleX,
                            y: point.y * scaleY,
                        }));
                        this.store.dispatch(
                            MovieDetailsActions.updatePolygon({
                                polygonId: polygonData.id,
                                changes: { points: newPoints },
                            })
                        );
                    });
                });
        }
    }
}
