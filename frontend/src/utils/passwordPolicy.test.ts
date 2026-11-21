import { describe, expect, it } from 'vitest';
import { evaluatePassword, isPasswordSecure } from './passwordPolicy';

describe('passwordPolicy', () => {
  it('acepta una contraseña que cumple todas las reglas', () => {
    expect(isPasswordSecure('GestorAcad2026!')).toBe(true);
  });

  it('rechaza contraseñas sin mayúscula, número o símbolo', () => {
    expect(isPasswordSecure('gestoracad')).toBe(false);
    expect(isPasswordSecure('GESTORACAD')).toBe(false);
    expect(isPasswordSecure('GestorAcad')).toBe(false);
  });

  it('rechaza contraseñas comunes y longitudes fuera de rango', () => {
    expect(isPasswordSecure('password1!')).toBe(false);
    expect(isPasswordSecure('Ab1!')).toBe(false);
    expect(isPasswordSecure(`Aa1!${'x'.repeat(100)}`)).toBe(false);
  });

  it('expone el estado de cada regla para la interfaz', () => {
    const rules = evaluatePassword('GestorAcad2026!');
    expect(rules).toHaveLength(6);
    expect(rules.every((rule) => rule.valid)).toBe(true);
  });
});
