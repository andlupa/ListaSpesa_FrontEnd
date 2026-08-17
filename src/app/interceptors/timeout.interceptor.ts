import { HttpInterceptorFn } from '@angular/common/http';
import { timeout } from 'rxjs/operators';

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(timeout(15000)); // 15 secondi, ragionevole per un utilizzo normale
};
