import { Component } from '@angular/core';
import { ListaArticoli } from './components/lista-articoli/lista-articoli';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ListaArticoli],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'listaspesa-frontend';
}
