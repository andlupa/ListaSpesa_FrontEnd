import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Articolo } from '../models/articolo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ArticoloService {
  private apiUrl = `${environment.apiUrl}/articoli`;

  constructor(private http: HttpClient) { }

  getArticoli(): Observable<Articolo[]> {
    return this.http.get<Articolo[]>(this.apiUrl);
  }

  getArticoliDaComprare(): Observable<Articolo[]> {
    return this.http.get<Articolo[]>(`${this.apiUrl}/damcomprare`);
  }

  getArticoloById(id: number): Observable<Articolo> {
    return this.http.get<Articolo>(`${this.apiUrl}/${id}`);
  }

  createArticolo(articolo: Partial<Articolo>): Observable<Articolo> {
    return this.http.post<Articolo>(this.apiUrl, articolo);
  }

  updateArticolo(id: number, articolo: Partial<Articolo>): Observable<Articolo> {
    return this.http.put<Articolo>(`${this.apiUrl}/${id}`, articolo);
  }

  deleteArticolo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
