import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { openReceiptInNewTab } from './receipt';

describe('openReceiptInNewTab', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    window.open = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('abre una pestaña nueva con la URL del blob y luego la libera', () => {
    const blob = new Blob(['pdf']);
    openReceiptInNewTab(blob);

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(window.open).toHaveBeenCalledWith('blob:mock-url', '_blank');

    vi.advanceTimersByTime(60000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
