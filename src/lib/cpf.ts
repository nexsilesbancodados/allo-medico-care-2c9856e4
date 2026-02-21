export const validarCPF = (cpf: string): boolean => {
  const c = cpf.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;

  const calc = (mod: number) => {
    const sum = c
      .slice(0, mod)
      .split("")
      .reduce((acc, d, i) => acc + parseInt(d) * (mod + 1 - i), 0);
    const rest = (sum * 10) % 11;
    return rest >= 10 ? 0 : rest;
  };

  return calc(9) === parseInt(c[9]) && calc(10) === parseInt(c[10]);
};

export const formatarCPF = (cpf: string): string => {
  const c = cpf.replace(/\D/g, "").slice(0, 11);
  if (c.length <= 3) return c;
  if (c.length <= 6) return `${c.slice(0, 3)}.${c.slice(3)}`;
  if (c.length <= 9) return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6)}`;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
};
