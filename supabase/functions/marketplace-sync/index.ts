import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SyncRequest = {
  channel_id?: string;
  trigger_source?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase environment is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing authorization header" }, 401);

    const body = (await req.json()) as SyncRequest;
    if (!body.channel_id) return jsonResponse({ error: "channel_id is required" }, 400);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: channel, error: channelError } = await supabase
      .from("marketplace_channels")
      .select("id,company_id,platform,name,settings")
      .eq("id", body.channel_id)
      .maybeSingle();

    if (channelError) throw channelError;
    if (!channel) return jsonResponse({ error: "Marketplace channel not found" }, 404);

    const { data: syncLogId, error: startError } = await supabase.rpc("start_marketplace_sync", {
      p_company_id: channel.company_id,
      p_channel_id: channel.id,
      p_trigger_source: body.trigger_source ?? "MANUAL",
    });

    if (startError) throw startError;

    const connectorMode = channel.settings?.connector_mode ?? "manual";
    const canUseRealConnector = connectorMode === "api";

    const ordersImported = 0;
    const message = canUseRealConnector
      ? "Marketplace connector credentials are configured, but provider adapter is not implemented yet."
      : "Manual connector mode: sync completed without importing external orders.";

    const { error: finishError } = await supabase.rpc("finish_marketplace_sync", {
      p_company_id: channel.company_id,
      p_sync_log_id: syncLogId,
      p_status: "SUCCESS",
      p_orders_imported: ordersImported,
      p_error_message: message,
    });

    if (finishError) throw finishError;

    return jsonResponse({
      ok: true,
      sync_log_id: syncLogId,
      channel_id: channel.id,
      platform: channel.platform,
      orders_imported: ordersImported,
      message,
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown marketplace sync error" }, 400);
  }
});
