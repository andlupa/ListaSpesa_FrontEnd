import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Libro } from '../models/libro.model';

@Injectable({
  providedIn: 'root'
})
export class LibroService {
  private apiUrl = 'http://localhost:5004/api/libri';

  constructor(private http: HttpClient) { }

  getLibri(): Observable<Libro[]> {
    return this.http.get<Libro[]>(this.apiUrl);
  }

  getLibroById(id: number): Observable<Libro> {
    return this.http.get<Libro>(`${this.apiUrl}/${id}`);
  }

  createLibro(libro: Partial<Libro>): Observable<Libro> {
    return this.http.post<Libro>(this.apiUrl, libro);
  }

  updateLibro(id: number, libro: Partial<Libro>): Observable<Libro> {
    return this.http.put<Libro>(`${this.apiUrl}/${id}`, libro);
  }

  deleteLibro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
