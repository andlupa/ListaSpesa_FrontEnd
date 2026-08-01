import { Component } from '@angular/core';
import { ListaLibri } from './components/lista-libri/lista-libri';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ListaLibri],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'biblioteca-frontend';
}
