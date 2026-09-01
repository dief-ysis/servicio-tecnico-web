import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadReceipt } from './receipt';

describe('downloadReceipt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('dispara la descarga con la URL del blob y luego la libera', () => {
    const blob = new Blob(['pdf']);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadReceipt(blob, 'comprobante-7.pdf');

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  test('usa el nombre de archivo indicado y no deja el <a> en el DOM', () => {
    const blob = new Blob(['pdf']);
    let anchorEnClick = null;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function capturar() {
      // El <a> tiene que estar montado en el momento del click para que la
      // descarga se dispare en todos los navegadores.
      anchorEnClick = { download: this.download, href: this.href, montado: this.isConnected };
    });

    downloadReceipt(blob, 'comprobante-7.pdf');

    expect(anchorEnClick).toEqual({
      download: 'comprobante-7.pdf',
      href: 'blob:mock-url',
      montado: true,
    });
    expect(document.querySelector('a[download]')).toBeNull();
  });

  test('sin nombre explícito usa uno por defecto', () => {
    const blob = new Blob(['pdf']);
    let nombre = null;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function capturar() {
      nombre = this.download;
    });

    downloadReceipt(blob);

    expect(nombre).toBe('comprobante.pdf');
  });
});
