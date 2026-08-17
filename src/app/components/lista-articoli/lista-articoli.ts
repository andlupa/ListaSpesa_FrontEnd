import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArticoloService } from '../../services/articolo';
import { CategoriaService } from '../../services/categoria';
import { Articolo } from '../../models/articolo.model';
import { Categoria } from '../../models/categoria.model';
import { RigaArticolo } from '../riga-articolo/riga-articolo';

interface GruppoNegozio { nomeNegozio: string; articoli: Articolo[]; }
interface GruppoCategoria { nomeCategoria: string; articoli: Articolo[]; }

@Component({
  selector: 'app-lista-articoli',
  standalone: true,
  imports: [CommonModule, FormsModule, RigaArticolo],
  templateUrl: './lista-articoli.html',
  styleUrl: './lista-articoli.css'
})
export class ListaArticoli implements OnInit {
  articoli = signal<Articolo[]>([]);
  categorie = signal<Categoria[]>([]);
  caricamento = signal(true);
  errore = signal<string | null>(null);

  inCreazioneCategoria = signal(false);
  nomeNuovaCategoria = signal('');

  negoziEspansi = signal<Set<string>>(new Set());
  categorieEspanse = signal<Set<string>>(new Set());

  inCreazione = signal(false);
  formNuovo = signal<Partial<Articolo>>({
    priorita: 0, daComprareSiNo: true, quantità: 1
  });

  constructor(
    private articoloService: ArticoloService,
    private categoriaService: CategoriaService
  ) { }

  ngOnInit(): void {
    this.categoriaService.getCategorie().subscribe({
      next: (data) => {
        const ordinate = [...data].sort((a, b) =>
          a.nomeCategoria.localeCompare(b.nomeCategoria)
        );
        this.categorie.set(ordinate);
      },
      error: (err) => {
        this.errore.set(this.formattaErrore(err, 'loading categories'));
      }
    });
    this.caricaArticoli();
  }

  caricaArticoli(): void {
    this.caricamento.set(true);
    this.articoloService.getArticoli().subscribe({
      next: (data) => { this.articoli.set(data); this.caricamento.set(false); },
      error: (err) => {
        this.errore.set(this.formattaErrore(err, 'loading products'));
        this.caricamento.set(false);
      }
    });
  }

  private trovaCategoria(idCategoria: number): Categoria | undefined {
    return this.categorie().find(c => c.idCategoria === idCategoria);
  }

  daComprareSenzaNegozio = computed(() =>
    this.articoli().filter(a => a.daComprareSiNo && !a.nomeNegozio)
      .sort((x, y) => y.priorita - x.priorita)
  );

  daComprareConNegozio = computed<GruppoNegozio[]>(() => {
    const conNegozio = this.articoli().filter(a => a.daComprareSiNo && a.nomeNegozio);
    const mappa = new Map<string, Articolo[]>();
    for (const a of conNegozio) {
      if (!mappa.has(a.nomeNegozio!)) mappa.set(a.nomeNegozio!, []);
      mappa.get(a.nomeNegozio!)!.push(a);
    }
    return Array.from(mappa.entries())
      .map(([nomeNegozio, lista]) => ({
        nomeNegozio,
        articoli: lista.sort((x, y) => {
          if (y.priorita !== x.priorita) return y.priorita - x.priorita;
          return (x.categoria?.nomeCategoria || '').localeCompare(y.categoria?.nomeCategoria || '');
        })
      }))
      .sort((a, b) => a.nomeNegozio.localeCompare(b.nomeNegozio));
  });

  nonSelezionati = computed<GruppoCategoria[]>(() => {
    const nonSel = this.articoli().filter(a => !a.daComprareSiNo);
    const mappa = new Map<string, Articolo[]>();
    for (const a of nonSel) {
      const chiave = a.categoria?.nomeCategoria || 'No Category';
      if (!mappa.has(chiave)) mappa.set(chiave, []);
      mappa.get(chiave)!.push(a);
    }
    return Array.from(mappa.entries())
      .map(([nomeCategoria, lista]) => ({ nomeCategoria, articoli: lista }))
      .sort((a, b) => a.nomeCategoria.localeCompare(b.nomeCategoria));
  });

  toggleNegozio(nome: string): void {
    const set = new Set(this.negoziEspansi());
    set.has(nome) ? set.delete(nome) : set.add(nome);
    this.negoziEspansi.set(set);
  }
  isNegozioEspanso(nome: string): boolean { return this.negoziEspansi().has(nome); }

  toggleCategoria(nome: string): void {
    const set = new Set(this.categorieEspanse());
    set.has(nome) ? set.delete(nome) : set.add(nome);
    this.categorieEspanse.set(set);
  }
  isCategoriaEspansa(nome: string): boolean { return this.categorieEspanse().has(nome); }

  // Chiamato dal figlio quando si clicca la checkbox
  onToggleSpunta(articolo: Articolo): void {
    const aggiornato = {
      ...articolo,
      daComprareSiNo: !articolo.daComprareSiNo,
      categoria: this.trovaCategoria(articolo.idCategoria)
    };
    this.articoloService.updateArticolo(articolo.idArticolo, aggiornato).subscribe({
      next: () => {
        this.articoli.update(lista =>
          lista.map(a => a.idArticolo === articolo.idArticolo ? aggiornato : a)
        );
      },
      error: (err) => this.errore.set(this.formattaErrore(err, 'update product'))
    });
  }

  // Chiamato dal figlio quando si conferma il form di modifica
  onSalvaArticolo(dati: Partial<Articolo>): void {
    if (!dati.idArticolo) return;
    const datiCompleti = { ...dati, categoria: this.trovaCategoria(dati.idCategoria!) };

    this.articoloService.updateArticolo(dati.idArticolo, datiCompleti).subscribe({
      next: () => {
        this.articoli.update(lista =>
          lista.map(a => a.idArticolo === dati.idArticolo ? { ...a, ...datiCompleti } as Articolo : a)
        );
      },
      error: (err) => {
        this.errore.set(this.formattaErrore(err, 'save product'));
      }
    });
  }

  // --- Creazione nuovo articolo (invariato) ---

  iniziaCreazione(): void {
    this.inCreazione.set(true);
    this.formNuovo.set({
      priorita: 0, daComprareSiNo: true, quantità: 1,
      idCategoria: this.categorie()[0]?.idCategoria
    });
  }

  annullaCreazione(): void {
    this.inCreazione.set(false);
    this.formNuovo.set({});
  }

  aggiornaCampoNuovo(campo: keyof Articolo, valore: any): void {
    if (campo === 'priorita' || campo === 'idCategoria') valore = Number(valore);
    this.formNuovo.update(f => ({ ...f, [campo]: valore }));
  }

  confermaCreazione(): void {
    const dati = this.formNuovo();
    if (!dati.nomeArticolo || !dati.idCategoria) {
      this.errore.set('Product Name and Category are mandatory.');
      return;
    }
    this.articoloService.createArticolo(dati).subscribe({
      next: (nuovo) => {
        const nuovoCompleto = { ...nuovo, categoria: this.trovaCategoria(nuovo.idCategoria) };
        this.articoli.update(lista => [...lista, nuovoCompleto]);
        this.inCreazione.set(false);
        this.formNuovo.set({});
      },
      error: (err) => {
        this.errore.set(this.formattaErrore(err, 'create product'));
      }
    });
  }

  iniziaCreazioneCategoria(): void {
    this.inCreazioneCategoria.set(true);
    this.nomeNuovaCategoria.set('');
  }

  annullaCreazioneCategoria(): void {
    this.inCreazioneCategoria.set(false);
    this.nomeNuovaCategoria.set('');
  }

  confermaCreazioneCategoria(): void {
    const nome = this.nomeNuovaCategoria().trim();
    if (!nome) {
      this.errore.set('Category Name is mandatory.');
      return;
    }

    this.categoriaService.createCategoria({ nomeCategoria: nome }).subscribe({
      next: (nuova) => {
        const aggiornate = [...this.categorie(), nuova]
          .sort((a, b) => a.nomeCategoria.localeCompare(b.nomeCategoria));
        this.categorie.set(aggiornate);

        // Seleziona automaticamente la categoria appena creata nel form nuovo articolo
        this.formNuovo.update(f => ({ ...f, idCategoria: nuova.idCategoria }));

        this.inCreazioneCategoria.set(false);
        this.nomeNuovaCategoria.set('');
      },
      error: (err) => {
        this.errore.set(this.formattaErrore(err, 'create category'));
      }
    });
  }

  private formattaErrore(err: any, contesto: string): string {
    if (err.name === 'TimeoutError' || err.status === 0) {
      return 'Server might starting up (after inactivity it may require about 30 seconds).';
    }
    if (err.status === 0) {
      return `Impossible to contact the Server (${contesto}). Verify connection.`;
    }
    if (err.status === 401) {
      return `Not valid Key supplied (${contesto}).`;
    }
    if (err.status === 404) {
      return `Resource not found (${contesto}).`;
    }
    if (err.status === 409) {
      return err.error?.message || err.error || `Conflict: the resource already exists (${contesto}).`;
    }
    if (err.status === 500) {
      return `Server internal error (${contesto}). Code: 500.`;
    }
    return `Unexpected error (${contesto}). Code: ${err.status || 'sconosciuto'}.`;
  }

  riconnetti(): void {
    this.errore.set(null);
    this.categoriaService.getCategorie().subscribe({
      next: (data) => {
        const ordinate = [...data].sort((a, b) => a.nomeCategoria.localeCompare(b.nomeCategoria));
        this.categorie.set(ordinate);
      },
      error: (err) => this.errore.set(this.formattaErrore(err, 'caricamento categorie'))
    });
    this.caricaArticoli();
  }
}

