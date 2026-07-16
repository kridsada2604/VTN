import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RequestBody = {
  conversation_id: string;
  message: string;
};

const textFromResponse = (payload: Record<string, unknown>) => {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) return payload.output_text.trim();
  const output = Array.isArray(payload.output) ? payload.output : [];
  const parts: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown }).content) ? (item as { content: unknown[] }).content : [];
    for (const entry of content) {
      if (!entry || typeof entry !== "object") continue;
      const text = (entry as { text?: unknown }).text;
      if (typeof text === "string") parts.push(text);
    }
  }

  return parts.join("\n").trim() || "I could not generate a response from the provider.";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("OPENAI_MODEL") || "gpt-5.2";

    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase environment is not configured");
    if (!openaiKey) throw new Error("OPENAI_API_KEY is not configured");

    const authorization = req.headers.get("Authorization");
    if (!authorization) throw new Error("Authorization header is required");

    const body = (await req.json()) as RequestBody;
    if (!body.conversation_id || !body.message?.trim()) throw new Error("conversation_id and message are required");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    });

    const { data: conversation, error: conversationError } = await supabase
      .from("ai_conversations")
      .select("id,title,context_scope,status")
      .eq("id", body.conversation_id)
      .eq("status", "OPEN")
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) throw new Error("Conversation not found");

    const { error: userMessageError } = await supabase.from("ai_messages").insert({
      conversation_id: body.conversation_id,
      role: "user",
      content: body.message.trim(),
      metadata: { source: "edge_openai_user" },
    });
    if (userMessageError) throw userMessageError;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: "You are VTN Business ERP AI Assistant. Give concise, operational ERP guidance with Thai business context when helpful.",
        input: `Conversation: ${conversation.title}\nScope: ${conversation.context_scope}\nUser: ${body.message.trim()}`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI provider error: ${response.status} ${errorText}`);
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const assistantText = textFromResponse(payload);

    const { error: assistantMessageError } = await supabase.from("ai_messages").insert({
      conversation_id: body.conversation_id,
      role: "assistant",
      content: assistantText,
      metadata: { source: "openai_responses", model },
    });
    if (assistantMessageError) throw assistantMessageError;

    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", body.conversation_id);

    return new Response(JSON.stringify({ ok: true, assistant: assistantText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
