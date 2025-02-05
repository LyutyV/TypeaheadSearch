import { Component, AfterViewInit, ElementRef, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { IMovie } from '../../interfaces/movie.interface';
import { selectPolygonsForMovie } from '../../store/poligone/polygons.selectors';
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

    private rotationModeActive = false;
    private pendingClick: { x: number; y: number } | null = null;

    constructor(private store: Store) {}

    closeDetails(): void {
        this.close.emit();
    }

    ngAfterViewInit(): void {
        const canvasEl = this.canvas.nativeElement;
        this.canvasContext = canvasEl.getContext('2d')!;
        canvasEl.width = canvasEl.offsetWidth;
        canvasEl.height = canvasEl.offsetHeight;
        this.loadBackgroundImage();

        // При звичайному малюванні ми підписуємось на зміну всіх полігонів
        if (this.movie) {
            this.store.select(selectPolygonsForMovie(this.movie.imdbID)).subscribe((polygons: IPolygon[]) => this.draw(polygons));
        }

        // Додаємо слухачі для mousedown і mouseup
        canvasEl.addEventListener('mousedown', this.onMouseDown.bind(this));
        canvasEl.addEventListener('mouseup', this.onMouseUp.bind(this));
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

    // Обробка mousedown: визначаємо, чи потрібно увійти в режим обертання, або просто зафіксувати координати кліку.
    private onMouseDown(event: MouseEvent): void {
        const rect = this.canvas.nativeElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (!this.movie) return;

        // Отримуємо всі полігони для даного фільму
        this.store
            .select(selectPolygonsForMovie(this.movie.imdbID))
            .pipe(take(1))
            .subscribe((polygons: IPolygon[]) => {
                // Якщо є замкнений (закритий) полігон, в якому клік (mousedown) відбувається всередині, запускаємо режим обертання
                const closedPolygon = polygons.find((polygon) => polygon.color && this.isPointInPolygon(polygon.points, x, y));
                if (closedPolygon) {
                    this.rotationModeActive = true;
                    this.startRotationMode(closedPolygon);
                } else {
                    // Якщо клік не всередині замкнутого полігону, фіксуємо координати для подальшого "кліку"
                    this.pendingClick = { x, y };
                }
            });
    }

    // Обробка mouseup: якщо режим обертання активний – завершуємо його, інакше обробляємо як "клік" (натискання й відпускання)
    private onMouseUp(event: MouseEvent): void {
        if (this.rotationModeActive) {
            // Завершуємо режим обертання (слухачі mousemove видаляються у startRotationMode)
            this.rotationModeActive = false;
            return;
        }
        if (this.pendingClick) {
            const { x, y } = this.pendingClick;
            this.handleClick(x, y);
            this.pendingClick = null;
        }
    }

    // Обробка "кліку" – додаємо точку або закриваємо відкритий полігон
    private handleClick(x: number, y: number): void {
        if (!this.movie) return;

        this.store
            .select(selectPolygonsForMovie(this.movie.imdbID))
            .pipe(take(1))
            .subscribe((polygons: IPolygon[]) => {
                // Шукаємо відкритий (active) полігон (без кольору)
                const activePolygon = polygons.find((polygon) => !polygon.color);
                if (!activePolygon) {
                    // Якщо немає активного полігону – створюємо новий з першою точкою
                    const newPolygonId = Math.random().toString();
                    const newPolygon: IPolygon = {
                        id: newPolygonId,
                        points: [{ x, y }],
                        movieId: this.movie!.imdbID,
                    };
                    this.store.dispatch(MovieDetailsActions.createPolygon({ polygon: newPolygon }));
                } else {
                    // Якщо полігон відкритий, перевіряємо, чи клік відбувається біля першої точки для його закриття
                    if (activePolygon.points.length > 0 && this.isClickOnFirstPoint(activePolygon.points, x, y)) {
                        const color = this.getRandomColor();
                        this.store.dispatch(MovieDetailsActions.closeActivePolygon({ color }));
                    } else {
                        // Інакше – додаємо точку до відкритого полігону
                        this.store.dispatch(MovieDetailsActions.addPoint({ polygonId: activePolygon.id, point: { x, y } }));
                    }
                }
            });
    }

    // Режим обертання: під час утримання кнопки миші, якщо курсор всередині замкнутого полігону, обертаємо його.
    private startRotationMode(polygon: IPolygon): void {
        const canvasEl = this.canvas.nativeElement;
        // Зберігаємо базові точки полігону (до обертання)
        const basePoints = polygon.points.map((pt) => ({ ...pt }));
        // Обчислюємо центр полігону
        const center = this.computeCenter(basePoints);

        const onMouseMove = (e: MouseEvent) => {
            const bounds = canvasEl.getBoundingClientRect();
            const mouseX = e.clientX - bounds.left;
            const mouseY = e.clientY - bounds.top;
            // Обчислюємо кут між центром полігону та поточними координатами миші
            const angle = Math.atan2(mouseY - center.y, mouseX - center.x);
            // Обчислюємо нові координати точок полігону, застосовуючи обертання відносно базових точок
            const rotatedPoints = this.rotatePoints(basePoints, angle);
            // Диспатчимо оновлення полігону з новими точками
            this.store.dispatch(
                MovieDetailsActions.updatePolygon({
                    polygonId: polygon.id,
                    changes: { points: rotatedPoints },
                })
            );
            // Опціонально перерисовуємо канвас
            if (this.movie) {
                this.store
                    .select(selectPolygonsForMovie(this.movie.imdbID))
                    .pipe(take(1))
                    .subscribe((polygons: IPolygon[]) => this.draw(polygons));
            }
        };

        // Додаємо слухача mousemove для режиму обертання
        canvasEl.addEventListener('mousemove', onMouseMove);

        // При події mouseup видаляємо слухачі, що припинять режим обертання
        const onMouseUp = () => {
            canvasEl.removeEventListener('mousemove', onMouseMove);
            canvasEl.removeEventListener('mouseup', onMouseUp);
            // Завершуємо режим обертання
        };
        canvasEl.addEventListener('mouseup', onMouseUp);
    }

    // Допоміжна функція для обчислення центру полігону
    private computeCenter(points: { x: number; y: number }[]): { x: number; y: number } {
        let centerX = 0,
            centerY = 0;
        points.forEach((pt) => {
            centerX += pt.x;
            centerY += pt.y;
        });
        return { x: centerX / points.length, y: centerY / points.length };
    }

    // Допоміжна функція для перевірки, чи знаходиться точка всередині полігону (алгоритм ray-casting)
    private isPointInPolygon(points: { x: number; y: number }[], x: number, y: number): boolean {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x,
                yi = points[i].y;
            const xj = points[j].x,
                yj = points[j].y;
            const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 0.000001) + xi;
            if (intersect) inside = !inside;
        }
        return inside;
    }

    // Допоміжна функція для обертання точок полігону навколо його центру на заданий кут (angle)
    private rotatePoints(points: { x: number; y: number }[], angle: number): { x: number; y: number }[] {
        const center = this.computeCenter(points);
        return points.map((pt) => {
            const dx = pt.x - center.x;
            const dy = pt.y - center.y;
            const r = Math.hypot(dx, dy);
            const currentAngle = Math.atan2(dy, dx);
            const newAngle = currentAngle + angle;
            return {
                x: center.x + r * Math.cos(newAngle),
                y: center.y + r * Math.sin(newAngle),
            };
        });
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

    // Метод draw, який малює всі полігони
    private draw(polygons: IPolygon[]): void {
        if (!this.backgroundImage) return;
        const ctx = this.canvasContext;
        // Малюємо фон
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
            // Якщо полігон замкнений
            if (polygon.length > 2 && polygon[0].x === polygon[polygon.length - 1].x && polygon[0].y === polygon[polygon.length - 1].y) {
                ctx.closePath();
                ctx.fillStyle = polygonData.color || 'rgba(0, 255, 0, 0.3)';
                ctx.fill();
            }
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Малюємо точки полігону
            polygon.forEach((point) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = 'green';
                ctx.fill();
            });
            ctx.restore();
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
