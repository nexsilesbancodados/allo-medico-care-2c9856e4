interface Feriado {
  date: string;
  name: string;
  type: string;
}

let cache: Record<number, Date[]> = {};

export const getFeriadosNacionais = async (ano: number): Promise<Date[]> => {
  if (cache[ano]) return cache[ano];

  try {
    const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
    if (!res.ok) return [];
    const feriados: Feriado[] = await res.json();
    const dates = feriados.map((f) => {
      const [y, m, d] = f.date.split("-").map(Number);
      return new Date(y, m - 1, d);
    });
    cache[ano] = dates;
    return dates;
  } catch {
    return [];
  }
};

export const isFeriado = async (date: Date): Promise<boolean> => {
  const feriados = await getFeriadosNacionais(date.getFullYear());
  return feriados.some(
    (f) =>
      f.getFullYear() === date.getFullYear() &&
      f.getMonth() === date.getMonth() &&
      f.getDate() === date.getDate()
  );
};
