import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaLibri } from './lista-libri';

describe('ListaLibri', () => {
  let component: ListaLibri;
  let fixture: ComponentFixture<ListaLibri>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaLibri],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaLibri);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
