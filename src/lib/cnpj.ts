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

export const buscarDadosCNPJ = async (cnpj: string): Promise<DadosCNPJ | null> => {
  const cnpjLimpo = cnpj.replace(/\D/g, "");
  if (cnpjLimpo.length !== 14) return null;

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      razaoSocial: data.razao_social || "",
      nomeFantasia: data.nome_fantasia || "",
      situacao: data.descricao_situacao_cadastral || "",
      logradouro: `${data.logradouro || ""}, ${data.numero || ""} ${data.complemento || ""}`.trim(),
      municipio: data.municipio || "",
      uf: data.uf || "",
      telefone: data.ddd_telefone_1 || "",
    };
  } catch {
    return null;
  }
};
