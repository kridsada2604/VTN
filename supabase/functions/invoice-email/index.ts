import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type InvoiceEmailRequest = {
  invoice_id?: string;
  recipient_email?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const money = (value: number | string) =>
  Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase environment is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing authorization header" }, 401);

    const body = (await req.json()) as InvoiceEmailRequest;
    if (!body.invoice_id) return jsonResponse({ error: "invoice_id is required" }, 400);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: invoice, error: invoiceError } = await supabase
      .from("sales_invoices")
      .select("id,company_id,document_no,invoice_date,due_date,total_amount,balance_amount,customers(name,email)")
      .eq("id", body.invoice_id)
      .maybeSingle();

    if (invoiceError) throw invoiceError;
    if (!invoice) return jsonResponse({ error: "Invoice not found" }, 404);

    const customer = Array.isArray(invoice.customers) ? invoice.customers[0] : invoice.customers;
    const recipientEmail = body.recipient_email ?? customer?.email;
    if (!recipientEmail) return jsonResponse({ error: "Invoice customer email is required" }, 400);

    const subject = `Invoice ${invoice.document_no} from VTN Business`;
    const html = `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
        <h2>Invoice ${invoice.document_no}</h2>
        <p>Dear ${customer?.name ?? "Customer"},</p>
        <p>Please find invoice ${invoice.document_no} dated ${invoice.invoice_date}.</p>
        <table style="border-collapse:collapse;margin-top:16px">
          <tr><td style="padding:6px 12px;border:1px solid #e5e7eb">Total</td><td style="padding:6px 12px;border:1px solid #e5e7eb">THB ${money(invoice.total_amount)}</td></tr>
          <tr><td style="padding:6px 12px;border:1px solid #e5e7eb">Balance</td><td style="padding:6px 12px;border:1px solid #e5e7eb">THB ${money(invoice.balance_amount)}</td></tr>
          <tr><td style="padding:6px 12px;border:1px solid #e5e7eb">Due Date</td><td style="padding:6px 12px;border:1px solid #e5e7eb">${invoice.due_date ?? "-"}</td></tr>
        </table>
        <p style="margin-top:16px">Thank you,<br/>VTN Business</p>
      </div>
    `;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("EMAIL_FROM") ?? "VTN Business <noreply@example.com>";

    let status = "SKIPPED";
    let providerMessageId: string | null = null;
    let errorMessage: string | null = "RESEND_API_KEY is not configured";

    if (resendApiKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [recipientEmail], subject, html }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        status = "FAILED";
        errorMessage = result?.message ?? "Resend email request failed";
      } else {
        status = "SENT";
        providerMessageId = result?.id ?? null;
        errorMessage = null;
      }
    }

    const { error: logError } = await supabase.from("document_email_logs").insert({
      company_id: invoice.company_id,
      document_type: "SALES_INVOICE",
      document_id: invoice.id,
      recipient_email: recipientEmail,
      subject,
      provider: "RESEND",
      status,
      provider_message_id: providerMessageId,
      error_message: errorMessage,
      sent_at: status === "SENT" ? new Date().toISOString() : null,
    });

    if (logError) throw logError;

    await supabase.from("sales_invoice_events").insert({
      invoice_id: invoice.id,
      event_type: "EMAIL",
      message: status === "SENT" ? `Email sent to ${recipientEmail}` : `Email ${status.toLowerCase()}: ${errorMessage}`,
    });

    return jsonResponse({
      ok: status === "SENT",
      status,
      recipient_email: recipientEmail,
      provider_message_id: providerMessageId,
      error_message: errorMessage,
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown invoice email error" }, 400);
  }
});
