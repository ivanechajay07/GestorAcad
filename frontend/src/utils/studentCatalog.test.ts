import { describe, expect, it } from 'vitest';
import { careersForFaculty, facultyNameForCareer, normalizeCatalogName } from './studentCatalog';
import type { CareerDto } from '../services/universityService';

const careers: CareerDto[] = [
  { id: 1, name: 'Ingeniería de Sistemas e Informática', facultyId: 1, facultyName: 'Facultad de Ingeniería y Arquitectura', active: true },
  { id: 2, name: 'Ingeniería Civil', facultyId: 1, facultyName: 'Facultad de Ingeniería y Arquitectura', active: true },
  { id: 3, name: 'Medicina Humana', facultyId: 2, facultyName: 'Facultad de Ciencias de la Salud', active: true },
];

describe('studentCatalog', () => {
  it('normaliza nombres con espacios y mayúsculas', () => {
    expect(normalizeCatalogName('  Facultad de Ingeniería  ')).toBe('facultad de ingeniería');
  });

  it('filtra las carreras de la facultad seleccionada', () => {
    const result = careersForFaculty(careers, 'Facultad de Ingeniería y Arquitectura');
    expect(result.map((c) => c.name)).toEqual([
      'Ingeniería de Sistemas e Informática',
      'Ingeniería Civil',
    ]);
  });

  it('no ofrece carreras si no hay facultad seleccionada', () => {
    expect(careersForFaculty(careers, '')).toEqual([]);
    expect(careersForFaculty(careers, undefined)).toEqual([]);
  });

  it('resuelve la facultad canónica de una carrera sin distinguir mayúsculas', () => {
    expect(facultyNameForCareer(careers, 'medicina humana')).toBe('Facultad de Ciencias de la Salud');
    expect(facultyNameForCareer(careers, 'Carrera inexistente')).toBeUndefined();
  });
});
