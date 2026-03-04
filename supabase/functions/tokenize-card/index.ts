import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Dedicated card tokenization endpoint.
 * Receives card data, tokenizes via Asaas API, returns only the token.
 * This minimizes the surface area where raw card data is handled.
 * 
 * IMPORTANT: This function NEVER logs card numbers or CVV.
 */

function getBaseUrl(apiKey: string): string {
  const env = Deno.env.get("ASAAS_ENVIRONMENT");
  if (env === "production") return "https://api.asaas.com/v3";
  if (env === "sandbox") return "https://api-sandbox.asaas.com/v3";
  if (apiKey.includes("hmlg") || apiKey.includes("sandbox")) {
    return "https://api-sandbox.asaas.com/v3";
  }
  return "https://api.asaas.com/v3";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Asaas not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = getBaseUrl(ASAAS_API_KEY);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      accept: "application/json",
      access_token: ASAAS_API_KEY,
    };

    const {
      customerName,
      customerCpf,
      customerEmail,
      customerPhone,
      cardHolderName,
      cardNumber,
      cardExpiryMonth,
      cardExpiryYear,
      cardCcv,
      cardHolderCpf,
      cardHolderPhone,
      cardHolderEmail,
      cardHolderPostalCode,
      cardHolderAddressNumber,
      cardHolderAddress,
      cardHolderProvince,
      remoteIp,
    } = await req.json();

    if (!cardNumber || !cardCcv || !customerCpf) {
      return new Response(
        JSON.stringify({ error: "Card data and customer CPF are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Find or create customer
    const cleanCpf = customerCpf.replace(/\D/g, "");
    const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${cleanCpf}`, { headers });
    const searchData = await searchRes.json();

    let customerId: string;
    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id;
    } else {
      const customerBody: Record<string, any> = {
        name: customerName || "Cliente",
        cpfCnpj: cleanCpf,
      };
      if (customerEmail) customerBody.email = customerEmail;
      if (customerPhone) {
        let rawPhone = customerPhone.replace(/\D/g, "");
        if (rawPhone.length === 13 && rawPhone.startsWith("55")) rawPhone = rawPhone.substring(2);
        if (rawPhone.length >= 10 && rawPhone.length <= 11) customerBody.mobilePhone = rawPhone;
      }

      const createRes = await fetch(`${baseUrl}/customers`, {
        method: "POST",
        headers,
        body: JSON.stringify(customerBody),
      });
      const customerData = await createRes.json();
      if (!createRes.ok) {
        return new Response(
          JSON.stringify({ error: customerData.errors?.[0]?.description || "Error creating customer" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      customerId = customerData.id;
    }

    // Step 2: Tokenize card via Asaas API (POST /v3/creditCard/tokenize)
    const tokenizeBody = {
      customer: customerId,
      creditCard: {
        holderName: cardHolderName || customerName,
        number: cardNumber.replace(/\s/g, ""),
        expiryMonth: cardExpiryMonth,
        expiryYear: cardExpiryYear,
        ccv: cardCcv,
      },
      creditCardHolderInfo: {
        name: cardHolderName || customerName,
        email: cardHolderEmail || customerEmail || "",
        cpfCnpj: (cardHolderCpf || customerCpf).replace(/\D/g, ""),
        phone: (cardHolderPhone || customerPhone || "").replace(/\D/g, ""),
        postalCode: (cardHolderPostalCode || "").replace(/\D/g, ""),
        addressNumber: cardHolderAddressNumber || "",
        address: cardHolderAddress || "",
        province: cardHolderProvince || "",
      },
    };

    if (remoteIp) {
      (tokenizeBody as any).remoteIp = remoteIp;
    }

    const tokenRes = await fetch(`${baseUrl}/creditCard/tokenizeCreditCard`, {
      method: "POST",
      headers,
      body: JSON.stringify(tokenizeBody),
    });
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Asaas tokenization error (no card data logged):", tokenData.errors);
      return new Response(
        JSON.stringify({ error: tokenData.errors?.[0]?.description || "Error tokenizing card" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return only the token - never return raw card data
    return new Response(
      JSON.stringify({
        success: true,
        creditCardToken: tokenData.creditCardToken,
        creditCardNumber: tokenData.creditCardNumber, // last 4 digits only
        creditCardBrand: tokenData.creditCardBrand,
        customerId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Tokenization error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
