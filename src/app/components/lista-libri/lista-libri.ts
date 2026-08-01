import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibroService } from '../../services/libro';
import { Libro } from '../../models/libro.model';

@Component({
  selector: 'app-lista-libri',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-libri.html',
  styleUrl: './lista-libri.css'
})
export class ListaLibri implements OnInit {
  libri = signal<Libro[]>([]);
  caricamento = signal(true);
  errore = signal<string | null>(null);

  constructor(private libroService: LibroService) { }

  ngOnInit(): void {
    this.libroService.getLibri().subscribe({
      next: (data) => {
        this.libri.set(data);
        this.caricamento.set(false);
      },
      error: (err) => {
        console.error('Errore nel caricamento dei libri:', err);
        this.errore.set('Impossibile caricare i libri. Verifica che il backend sia attivo.');
        this.caricamento.set(false);
      }
    });
  }
}
