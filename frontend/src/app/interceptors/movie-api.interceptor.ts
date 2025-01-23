import { HttpInterceptorFn } from '@angular/common/http';

export const movieApiInterceptor: HttpInterceptorFn = (req, next) => {
    if (req.url.includes('movie-database-alternative.p.rapidapi.com')) {
        const modifiedReq = req.clone({
            setHeaders: {
                'x-rapidapi-key': '1a3d6dc12amshaf7b6d62ef02951p1a121ajsnf87b81dd4ea4',
                'x-rapidapi-host': 'movie-database-alternative.p.rapidapi.com',
            },
        });
        return next(modifiedReq);
    }
    return next(req);
};
