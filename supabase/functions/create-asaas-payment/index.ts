import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAYMENT_TIMEOUT = 30000;

async function asaasFetch(url: string, options: RequestInit, attempt = 1): Promise<Response> {
  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(PAYMENT_TIMEOUT),
    });

    // Don't retry client errors (4xx)
    if (res.status >= 400 && res.status < 500) return res;

    // Retry server errors (5xx)
    if (!res.ok && attempt < 3) {
      console.warn(`Asaas API ${res.status}, retrying (${attempt}/3)...`);
      await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
      return asaasFetch(url, options, attempt + 1);
    }

    return res;
  } catch (error: any) {
    console.error(`Asaas fetch error (attempt ${attempt}/3):`, error.message);
    if (attempt >= 3) throw error;
    await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
    return asaasFetch(url, options, attempt + 1);
  }
}

async function safeJson(res: Response): Promise<any> {
  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    const text = await res.text();
    console.error("Asaas returned non-JSON:", text.substring(0, 300));
    throw new Error("Asaas API returned an invalid response");
  }
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Asaas not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Detect sandbox vs production based on key prefix
    const baseUrl = ASAAS_API_KEY.startsWith("$aact_")
      ? "https://api.asaas.com/v3"
      : "https://sandbox.asaas.com/api/v3";

    const {
      customerName,
      customerCpf,
      customerEmail,
      customerPhone,
      billingType,
      value,
      description,
      appointmentId,
      planId,
      cardHolderName,
      cardNumber,
      cardExpiryMonth,
      cardExpiryYear,
      cardCcv,
      cardHolderCpf,
      cardHolderPhone,
      cardHolderPostalCode,
      cardHolderAddressNumber,
      cycle,
    } = await req.json();

    if (!customerName || !customerCpf || !billingType || !value) {
      return new Response(
        JSON.stringify({ error: "customerName, customerCpf, billingType, and value are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "access_token": ASAAS_API_KEY,
    };

    // Step 1: Find or create customer
    const searchRes = await asaasFetch(`${baseUrl}/customers?cpfCnpj=${customerCpf.replace(/\D/g, "")}`, { headers });
    const searchData = await safeJson(searchRes);

    let customerId: string;

    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id;
    } else {
      const createCustomerRes = await asaasFetch(`${baseUrl}/customers`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: customerName,
          cpfCnpj: customerCpf.replace(/\D/g, ""),
          email: customerEmail || undefined,
          phone: customerPhone || undefined,
        }),
      });
      const customerData = await safeJson(createCustomerRes);
      if (!createCustomerRes.ok) {
        console.error("Asaas customer error:", customerData);
        return new Response(
          JSON.stringify({ error: customerData.errors?.[0]?.description || "Error creating customer" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      customerId = customerData.id;
    }

    // Step 2: Create payment or subscription
    if (cycle) {
      const subBody: Record<string, any> = {
        customer: customerId,
        billingType,
        value,
        cycle,
        description: description || "Assinatura AloClinica",
        externalReference: planId || undefined,
      };

      if (billingType === "CREDIT_CARD" && cardNumber) {
        subBody.creditCard = {
          holderName: cardHolderName,
          number: cardNumber.replace(/\s/g, ""),
          expiryMonth: cardExpiryMonth,
          expiryYear: cardExpiryYear,
          ccv: cardCcv,
        };
        subBody.creditCardHolderInfo = {
          name: cardHolderName || customerName,
          cpfCnpj: (cardHolderCpf || customerCpf).replace(/\D/g, ""),
          phone: cardHolderPhone || customerPhone || "",
          postalCode: cardHolderPostalCode || "",
          addressNumber: cardHolderAddressNumber || "",
        };
      }

      const subRes = await asaasFetch(`${baseUrl}/subscriptions`, {
        method: "POST",
        headers,
        body: JSON.stringify(subBody),
      });
      const subData = await safeJson(subRes);

      if (!subRes.ok) {
        console.error("Asaas subscription error:", subData);
        return new Response(
          JSON.stringify({ error: subData.errors?.[0]?.description || "Error creating subscription" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          type: "subscription",
          subscriptionId: subData.id,
          status: subData.status,
          ...subData,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const paymentBody: Record<string, any> = {
        customer: customerId,
        billingType,
        value,
        dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        description: description || "Consulta AloClinica",
        externalReference: appointmentId || undefined,
      };

      if (billingType === "CREDIT_CARD" && cardNumber) {
        paymentBody.creditCard = {
          holderName: cardHolderName,
          number: cardNumber.replace(/\s/g, ""),
          expiryMonth: cardExpiryMonth,
          expiryYear: cardExpiryYear,
          ccv: cardCcv,
        };
        paymentBody.creditCardHolderInfo = {
          name: cardHolderName || customerName,
          cpfCnpj: (cardHolderCpf || customerCpf).replace(/\D/g, ""),
          phone: cardHolderPhone || customerPhone || "",
          postalCode: cardHolderPostalCode || "",
          addressNumber: cardHolderAddressNumber || "",
        };
      }

      const payRes = await asaasFetch(`${baseUrl}/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify(paymentBody),
      });
      const payData = await safeJson(payRes);

      if (!payRes.ok) {
        console.error("Asaas payment error:", payData);
        return new Response(
          JSON.stringify({ error: payData.errors?.[0]?.description || "Error creating payment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If PIX, get QR code
      let pixData = null;
      if (billingType === "PIX" && payData.id) {
        await new Promise(r => setTimeout(r, 1500));
        try {
          const pixRes = await asaasFetch(`${baseUrl}/payments/${payData.id}/pixQrCode`, { headers });
          if (pixRes.ok) {
            pixData = await safeJson(pixRes);
          }
        } catch (e) {
          console.warn("PIX QR code fetch failed, payment still created:", e);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          type: "payment",
          paymentId: payData.id,
          status: payData.status,
          invoiceUrl: payData.invoiceUrl,
          bankSlipUrl: payData.bankSlipUrl,
          pixQrCode: pixData?.encodedImage || null,
          pixCopyPaste: pixData?.payload || null,
          ...payData,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
