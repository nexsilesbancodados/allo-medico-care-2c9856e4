import { logError } from "@/lib/logger";

export interface DadosCNPJ {
  razaoSocial: string;
  nomeFantasia: string;
  situacao: string;
  logradouro: string;
  municipio: string;
  uf: string;
  telefone: string;
}

export const validarCNPJ = (cnpj: string): boolean => {
  const c = cnpj.replace(/\D/g, "");
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;

  const calc = (len: number) => {
    const weights = len === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = c.slice(0, len).split("").reduce(
      (acc, d, i) => acc + parseInt(d) * weights[i], 0
    );
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return calc(12) === parseInt(c[12]) && calc(13) === parseInt(c[13]);
};

export const formatarCNPJ = (cnpj: string): string => {
  const c = cnpj.replace(/\D/g, "").slice(0, 14);
  if (c.length <= 2) return c;
  if (c.length <= 5) return `${c.slice(0, 2)}.${c.slice(2)}`;
  if (c.length <= 8) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5)}`;
  if (c.length <= 12) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8)}`;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
};

export const buscarDadosCNPJ = async (cnpj: string): Promise<DadosCNPJ | null> => {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return null;

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();

    const logradouro = [data.logradouro, data.numero, data.complemento]
      .filter(Boolean)
      .join(", ")
      .trim();

    return {
      razaoSocial: data.razao_social ?? "",
      nomeFantasia: data.nome_fantasia ?? "",
      situacao: data.descricao_situacao_cadastral ?? "",
      logradouro,
      municipio: data.municipio ?? "",
      uf: data.uf ?? "",
      telefone: data.ddd_telefone_1 ?? "",
    };
  } catch (err) {
    logError("buscarDadosCNPJ failed", err, { cnpj: digits });
    return null;
  }
};
