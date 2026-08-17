import { HttpInterceptorFn } from '@angular/common/http';
import { timeout, retry, tap } from 'rxjs/operators';

let serverPronto = false;

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  if (serverPronto) {
    // Il backend ha già risposto con successo almeno una volta: timeout normale
    return next(req).pipe(timeout(8000));
  }

  // Il backend potrebbe ancora essere in fase di avvio: timeout lungo + retry
  return next(req).pipe(
    timeout(30000),
    retry({ count: 2, delay: 3000 }),
    tap(() => { serverPronto = true; })
  );
};
