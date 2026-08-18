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
  // dichiaro i signal per l'interfaccia
  readonly articoli = signal<Articolo[]>([]);
  readonly categorie = signal<Categoria[]>([]);
  readonly errore = signal<string | null>(null);
  caricamento = signal(true);
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
    this.caricaCategorie();
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

  private categoriePerId = computed(() =>
    new Map(
      this.categorie().map(c => [c.idCategoria, c])
    )
  );

  private trovaCategoria(idCategoria: number): Categoria | undefined {
    return this.categoriePerId().get(idCategoria);
  }

  readonly daComprareSenzaNegozio = computed(() =>
    this.articoli().filter(a => a.daComprareSiNo && !a.nomeNegozio)
      .sort((x, y) => y.priorita - x.priorita)
  );

  readonly daComprareConNegozio = computed<GruppoNegozio[]>(() => {
    const mappa = new Map<string, Articolo[]>();

    for (const articolo of this.articoli()) {
      if (!articolo.daComprareSiNo || !articolo.nomeNegozio) {
        continue;
      }

      const lista = mappa.get(articolo.nomeNegozio) ?? [];
      lista.push(articolo);
      mappa.set(articolo.nomeNegozio, lista);
    }

    return [...mappa.entries()]
      .map(([nomeNegozio, articoli]) => ({
        nomeNegozio,
        articoli: [...articoli].sort((a, b) => {
          if (a.priorita !== b.priorita) {
            return b.priorita - a.priorita;
          }

          return (a.categoria?.nomeCategoria ?? '')
            .localeCompare(b.categoria?.nomeCategoria ?? '');
        })
      }))
      .sort((a, b) =>
        a.nomeNegozio.localeCompare(b.nomeNegozio)
      );
  });

  readonly nonSelezionati = computed<GruppoCategoria[]>(() => {
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

  aggiornaCampoNuovo<K extends keyof Articolo>(
    campo: K,
    valore: Articolo[K]
  ): void {
    let valoreNormalizzato = valore;

    if (campo === 'priorita' || campo === 'idCategoria') {
      valoreNormalizzato = Number(valore) as Articolo[K];
    }

    this.formNuovo.update(f => ({
      ...f,
      [campo]: valoreNormalizzato
    }));
  }

  confermaCreazione(): void {
    const dati = this.formNuovo();

    if (!dati.nomeArticolo?.trim() || dati.idCategoria == null) {
      this.errore.set(
        'Product Name and Category are mandatory.'
      );
      return;
    }

    this.errore.set(null);

    this.articoloService.createArticolo(dati).subscribe({
      next: nuovo => {
        const nuovoCompleto: Articolo = {
          ...nuovo,
          categoria: this.trovaCategoria(nuovo.idCategoria)
        };

        this.articoli.update(lista => [
          ...lista,
          nuovoCompleto
        ]);

        this.annullaCreazione();
      },
      error: err => {
        this.errore.set(
          this.formattaErrore(err, 'create product')
        );
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
    if (err.name === 'TimeoutError') {
      return 'The server is taking too long to respond.';
    }

    if (err.status === 0) {
      return `Impossible to contact the server (${contesto}). Verify the connection.`;
    }

    switch (err.status) {
      case 401:
        return `Unauthorized request (${contesto}).`;

      case 404:
        return `Resource not found (${contesto}).`;

      case 409:
        return err.error?.message
          || err.error
          || `Conflict (${contesto}).`;

      case 500:
        return `Internal server error (${contesto}).`;

      default:
        return `Unexpected error (${contesto}). Code: ${err.status ?? 'unknown'}.`;
    }
  }

  private caricaCategorie(): void {
    this.categoriaService.getCategorie().subscribe({
      next: data => {
        this.categorie.set(
          [...data].sort((a, b) =>
            a.nomeCategoria.localeCompare(b.nomeCategoria)
          )
        );
      },
      error: err => {
        this.errore.set(
          this.formattaErrore(err, 'loading categories')
        );
      }
    });
  }

  riconnetti(): void {
    this.errore.set(null);
    this.caricaCategorie();
    this.caricaArticoli();
  }
}
