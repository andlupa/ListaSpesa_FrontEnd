import { HttpInterceptorFn } from '@angular/common/http';
import { timeout, retry } from 'rxjs/operators';

let primaChiamataFatta = false;

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  const isPrimaChiamata = !primaChiamataFatta;
  primaChiamataFatta = true;

  const timeoutMs = isPrimaChiamata ? 25000 : 8000; // 25s alla prima, 8s dopo

  return next(req).pipe(
    timeout(timeoutMs),
    isPrimaChiamata ? retry({ count: 1, delay: 20000 }) : retry(0)
  );
};
