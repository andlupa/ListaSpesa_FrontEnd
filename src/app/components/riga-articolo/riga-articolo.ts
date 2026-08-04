import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Articolo } from '../../models/articolo.model';
import { Categoria } from '../../models/categoria.model';

@Component({
  selector: 'app-riga-articolo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './riga-articolo.html',
  styleUrl: './riga-articolo.css'
})
export class RigaArticolo {
  @Input() articolo!: Articolo;
  @Input() categorie: Categoria[] = [];
  @Input() selezionato = false; // stato della checkbox mostrata

  @Output() toggleSpunta = new EventEmitter<Articolo>();
  @Output() salva = new EventEmitter<Partial<Articolo>>();

  inModifica = signal(false);
  form = signal<Partial<Articolo>>({});

  apriModifica(): void {
    this.form.set({
      ...this.articolo,
      dataScadenzaOfferta: this.articolo.dataScadenzaOfferta
        ? this.articolo.dataScadenzaOfferta.split('T')[0]
        : null
    });
    this.inModifica.set(true);
  }

  annulla(): void {
    this.inModifica.set(false);
    this.form.set({});
  }

  conferma(): void {
    this.salva.emit(this.form());
    this.inModifica.set(false);
    this.form.set({});
  }

  aggiornaCampo(campo: keyof Articolo, valore: any): void {
    if (campo === 'priorita' || campo === 'idCategoria') {
      valore = Number(valore);
    }
    this.form.update(f => ({ ...f, [campo]: valore }));
  }

  onCheckbox(): void {
    this.toggleSpunta.emit(this.articolo);
  }

  offertaValida(): boolean {
    const a = this.articolo;
    if (a.prezzoOfferta == null) return false;
    if (!a.dataScadenzaOfferta) return true;

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const scadenza = new Date(a.dataScadenzaOfferta);
    scadenza.setHours(0, 0, 0, 0);

    return scadenza >= oggi;
  }
}
