import { logError } from "@/lib/logger";

export interface EnderecoViaCEP {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  ddd: string;
  ibge: string;
}

/** Normalize a raw CEP string to 8 digits, or null if invalid. */
const normalizeCep = (cep: string): string | null => {
  const digits = cep.replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
};

/** Fetch from ViaCEP. Returns null on error or CEP not found. */
const fetchViaCEP = async (cep: string): Promise<EnderecoViaCEP | null> => {
  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.erro) return null;
  return {
    logradouro: data.logradouro ?? "",
    bairro: data.bairro ?? "",
    cidade: data.localidade ?? "",
    estado: data.uf ?? "",
    ddd: data.ddd ?? "",
    ibge: data.ibge ?? "",
  };
};

/** Fallback: BrasilAPI (used if ViaCEP fails or returns erro). */
const fetchBrasilAPI = async (cep: string): Promise<EnderecoViaCEP | null> => {
  const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const fb = await res.json();
  return {
    logradouro: fb.street ?? "",
    bairro: fb.neighborhood ?? "",
    cidade: fb.city ?? "",
    estado: fb.state ?? "",
    ddd: "",
    ibge: fb.city_ibge ?? "",
  };
};

/**
 * Looks up a Brazilian address by CEP.
 * Tries ViaCEP first, falls back to BrasilAPI automatically.
 * Returns null if CEP is invalid or not found.
 */
export const buscarEnderecoPorCep = async (cep: string): Promise<EnderecoViaCEP | null> => {
  const normalized = normalizeCep(cep);
  if (!normalized) return null;

  try {
    const primary = await fetchViaCEP(normalized);
    if (primary) return primary;
  } catch (err) {
    logError("ViaCEP lookup failed, trying BrasilAPI", err, { cep: normalized });
  }

  try {
    return await fetchBrasilAPI(normalized);
  } catch (err) {
    logError("BrasilAPI lookup also failed", err, { cep: normalized });
    return null;
  }
};
