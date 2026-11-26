import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('escapa comillas, comas y valores nulos', () => {
    const csv = toCsv([
      ['Código', 'Estudiante', 'Nota'],
      ['2026-0001', 'Pérez, Juan "JP"', 15],
      ["2026-0002", null, undefined],
    ]);

    expect(csv).toBe(
      '"Código","Estudiante","Nota"\r\n'
      + '"2026-0001","Pérez, Juan ""JP""","15"\r\n'
      + '"2026-0002","",""'
    );
  });
});
