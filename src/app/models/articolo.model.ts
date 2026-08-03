import { Categoria } from './categoria.model';

export interface Articolo {
  idArticolo: number;
  idCategoria: number;
  categoria?: Categoria;
  nomeArticolo: string;
  prezzoNormale: number;
  daComprareSiNo: boolean;
  quantità: number;
  nomeNegozio: string | null;
  offertaSiNo: boolean;
  prezzoOfferta: number | null;
  dataScadenzaOfferta: string | null;
  priorita: number;              // -1, 0, 1
  unitaMisura: string | null;    // "kg", "un.", "l", null
}
