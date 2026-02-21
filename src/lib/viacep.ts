export interface EnderecoViaCEP {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  ddd: string;
  ibge: string;
}

export const buscarEnderecoPorCep = async (cep: string): Promise<EnderecoViaCEP | null> => {
  const cepLimpo = cep.replace(/\D/g, "");
  if (cepLimpo.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await res.json();

    if (data.erro) {
      // Fallback: BrasilAPI
      const fallback = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`);
      if (!fallback.ok) return null;
      const fb = await fallback.json();
      return {
        logradouro: fb.street || "",
        bairro: fb.neighborhood || "",
        cidade: fb.city || "",
        estado: fb.state || "",
        ddd: "",
        ibge: fb.city_ibge || "",
      };
    }

    return {
      logradouro: data.logradouro || "",
      bairro: data.bairro || "",
      cidade: data.localidade || "",
      estado: data.uf || "",
      ddd: data.ddd || "",
      ibge: data.ibge || "",
    };
  } catch {
    return null;
  }
};
