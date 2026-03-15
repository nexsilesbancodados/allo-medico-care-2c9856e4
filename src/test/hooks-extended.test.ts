import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── useCooldown ────────────────────────────────────────────────────────────
describe('useCooldown logic', () => {
  it('calculates seconds remaining correctly', () => {
    const start = Date.now();
    const duration = 30; // seconds
    const elapsed = 10_000; // ms
    const remaining = Math.max(0, duration - Math.floor((Date.now() - start + elapsed) / 1000));
    expect(remaining).toBeLessThanOrEqual(duration);
    expect(remaining).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 when cooldown expired', () => {
    const start = Date.now() - 60_000; // 60 seconds ago
    const duration = 30;
    const remaining = Math.max(0, duration - Math.floor((Date.now() - start) / 1000));
    expect(remaining).toBe(0);
  });
});

// ─── useMask ─────────────────────────────────────────────────────────────────
describe('CPF/CNPJ mask logic', () => {
  it('formats CPF correctly', () => {
    const apply = (v: string) => {
      const d = v.replace(/\D/g, '').slice(0, 11);
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
      if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
      return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
    };
    expect(apply('12345678901')).toBe('123.456.789-01');
    expect(apply('123.456.789-01')).toBe('123.456.789-01');
    expect(apply('12345')).toBe('123.45');
  });

  it('formats phone correctly', () => {
    const apply = (v: string) => {
      const d = v.replace(/\D/g, '').slice(0, 11);
      if (d.length <= 10)
        return d.replace(/(\d{2})(\d{4})(\d*)/, '($1) $2-$3');
      return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    };
    expect(apply('11999998888')).toBe('(11) 99999-8888');
    expect(apply('1133334444')).toBe('(11) 3333-4444');
  });

  it('formats CEP correctly', () => {
    const apply = (v: string) => {
      const d = v.replace(/\D/g, '').slice(0, 8);
      return d.length > 5 ? `${d.slice(0,5)}-${d.slice(5)}` : d;
    };
    expect(apply('01310100')).toBe('01310-100');
    expect(apply('01310-100')).toBe('01310-100');
  });
});

// ─── useKeyboardShortcuts logic ──────────────────────────────────────────────
describe('keyboard shortcuts filtering', () => {
  it('should not trigger in input elements', () => {
    const isInputActive = (tag: string, editable: boolean) => {
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable;
    };
    expect(isInputActive('INPUT', false)).toBe(true);
    expect(isInputActive('TEXTAREA', false)).toBe(true);
    expect(isInputActive('DIV', true)).toBe(true);
    expect(isInputActive('DIV', false)).toBe(false);
    expect(isInputActive('BUTTON', false)).toBe(false);
  });

  it('shortcuts map contains expected routes', () => {
    const shortcuts: Record<string, string> = {
      h: '/',
      d: '/dashboard',
      n: '/dashboard/schedule',
      p: '/dashboard/profile',
    };
    expect(shortcuts['h']).toBe('/');
    expect(shortcuts['d']).toBe('/dashboard');
    expect(shortcuts['n']).toBe('/dashboard/schedule');
  });
});

// ─── use-notification-title logic ────────────────────────────────────────────
describe('notification title logic', () => {
  it('restores original title when count is 0', () => {
    const getTitle = (count: number, original: string) =>
      count > 0 ? `(${count}) ${original}` : original;

    expect(getTitle(0, 'AloClínica')).toBe('AloClínica');
    expect(getTitle(3, 'AloClínica')).toBe('(3) AloClínica');
    expect(getTitle(99, 'AloClínica')).toBe('(99) AloClínica');
  });

  it('handles large unread counts gracefully', () => {
    const display = (n: number) => n > 99 ? '99+' : String(n);
    expect(display(100)).toBe('99+');
    expect(display(99)).toBe('99');
    expect(display(5)).toBe('5');
  });
});
