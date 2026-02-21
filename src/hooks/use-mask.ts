export function formatMask(value: string, type: 'cpf' | 'phone' | 'date'): string {
  const digits = value.replace(/\D/g, '');
  
  if (type === 'cpf') {
    return digits.slice(0, 11).replace(
      /(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/,
      (_, a, b, c, d) => {
        let result = a;
        if (b) result += `.${b}`;
        if (c) result += `.${c}`;
        if (d) result += `-${d}`;
        return result;
      }
    );
  }
  
  if (type === 'phone') {
    const sliced = digits.slice(0, 11);
    if (sliced.length === 0) return '';
    if (sliced.length <= 2) return `(${sliced}`;
    if (sliced.length <= 7) return `(${sliced.slice(0, 2)}) ${sliced.slice(2)}`;
    return `(${sliced.slice(0, 2)}) ${sliced.slice(2, 7)}-${sliced.slice(7)}`;
  }
  
  if (type === 'date') {
    const sliced = digits.slice(0, 8);
    if (sliced.length <= 2) return sliced;
    if (sliced.length <= 4) return `${sliced.slice(0, 2)}/${sliced.slice(2)}`;
    return `${sliced.slice(0, 2)}/${sliced.slice(2, 4)}/${sliced.slice(4)}`;
  }
  
  return value;
}

export function unmask(value: string): string {
  return value.replace(/\D/g, '');
}
