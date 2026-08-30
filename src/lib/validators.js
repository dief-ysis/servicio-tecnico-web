export function isValidEmail(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function calcularDigitoVerificador(numero) {
  let suma = 0;
  let multiplicador = 2;
  for (const digito of numero.split('').reverse()) {
    suma += parseInt(digito, 10) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

export function isValidRut(rut) {
  if (!rut) return false;
  const limpio = rut.replace(/[.\s]/g, '').toUpperCase();
  const match = limpio.match(/^(\d{1,8})-([0-9K])$/);
  if (!match) return false;
  const [, numero, dv] = match;
  return calcularDigitoVerificador(numero) === dv;
}
