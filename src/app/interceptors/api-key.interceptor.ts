import { HttpInterceptorFn } from '@angular/common/http';

const API_KEY = 'una-stringa-segreta-lunga-e-casuale';

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const clonedRequest = req.clone({
    setHeaders: {
      'X-API-Key': API_KEY
    }
  });
  return next(clonedRequest);
};
