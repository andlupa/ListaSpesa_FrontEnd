import { HttpInterceptorFn } from '@angular/common/http';
import { timeout, retry } from 'rxjs/operators';

const AVVIO_APP = Date.now();
const FINESTRA_AVVIO_MS = 40000; // 40 secondi di "grazia" dal caricamento della pagina

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  const dentroFinestraAvvio = (Date.now() - AVVIO_APP) < FINESTRA_AVVIO_MS;

  if (dentroFinestraAvvio) {
    return next(req).pipe(
      timeout(35000),
      retry({ count: 1, delay: 3000 })
    );
  }

  return next(req).pipe(timeout(8000));
};
