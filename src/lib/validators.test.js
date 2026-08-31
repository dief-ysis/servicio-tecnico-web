import { describe, test, expect } from 'vitest';
import { isValidEmail, isValidRut } from './validators';

describe('isValidEmail', () => {
  test('acepta un correo con formato válido', () => {
    expect(isValidEmail('ana@taller.cl')).toBe(true);
  });

  test('rechaza sin arroba', () => {
    expect(isValidEmail('ana-taller.cl')).toBe(false);
  });

  test('rechaza sin dominio', () => {
    expect(isValidEmail('ana@taller')).toBe(false);
  });
});

describe('isValidRut', () => {
  test('acepta un RUT válido sin puntos', () => {
    expect(isValidRut('12345678-5')).toBe(true);
  });

  test('acepta el mismo RUT con puntos', () => {
    expect(isValidRut('12.345.678-5')).toBe(true);
  });

  test('acepta dígito verificador K (mayúscula o minúscula)', () => {
    expect(isValidRut('6-K')).toBe(true);
    expect(isValidRut('6-k')).toBe(true);
  });

  test('rechaza un dígito verificador incorrecto', () => {
    expect(isValidRut('12345678-9')).toBe(false);
  });

  test('rechaza sin guión', () => {
    expect(isValidRut('123456785')).toBe(false);
  });

  test('rechaza vacío o null', () => {
    expect(isValidRut('')).toBe(false);
    expect(isValidRut(null)).toBe(false);
  });
});
