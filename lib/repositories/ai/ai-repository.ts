import type { createClient } from "@/lib/supabase/server";
import type { AddAiConversationMessageInput, CreateAiConversationInput } from "@/lib/validation/ai/ai";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type AiConversationRow = {
  id: string;
  title: string;
  context_scope: string;
  status: string;
  updated_at: string;
  created_at: string;
};

export type AiMessageRow = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

export type AiSuggestionRow = {
  id: string;
  module: string;
  title: string;
  description: string;
  priority: string;
  status: string;
};

export type AiInsight = {
  module: string;
  title: string;
  description: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
};

export type AiDashboardSummary = {
  headline: string;
  summary: string;
  focusAreas: string[];
};

export class AiRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async dashboard(companyId: string) {
    const [conversations, suggestions, invoices, stockBalances, marketplaceOrders, claims] = await Promise.all([
      this.supabase
        .from("ai_conversations")
        .select("id,title,context_scope,status,updated_at,created_at")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false }),
      this.supabase
        .from("ai_suggestions")
        .select("id,module,title,description,priority,status")
        .eq("company_id", companyId)
        .eq("status", "OPEN")
        .order("created_at", { ascending: false }),
      this.supabase
        .from("sales_invoices")
        .select("id,balance_amount", { count: "exact", head: false })
        .eq("company_id", companyId)
        .gt("balance_amount", 0),
      this.supabase
        .from("stock_balances")
        .select("id,quantity_on_hand", { count: "exact", head: false })
        .eq("company_id", companyId)
        .lte("quantity_on_hand", 0),
      this.supabase
        .from("marketplace_orders")
        .select("id,fulfillment_status", { count: "exact", head: false })
        .eq("company_id", companyId)
        .eq("fulfillment_status", "PENDING"),
      this.supabase
        .from("claims")
        .select("id,status", { count: "exact", head: false })
        .eq("company_id", companyId)
        .in("status", ["OPEN", "IN_REVIEW"]),
    ]);

    if (conversations.error) throw conversations.error;
    if (suggestions.error) throw suggestions.error;
    if (invoices.error) throw invoices.error;
    if (stockBalances.error) throw stockBalances.error;
    if (marketplaceOrders.error) throw marketplaceOrders.error;
    if (claims.error) throw claims.error;

    const insights: AiInsight[] = [
      {
        module: "Finance",
        title: "ติดตามยอดค้างชำระ",
        description: `มีใบแจ้งหนี้ค้างรับ ${invoices.count ?? 0} รายการ ควรจัดลำดับการติดตามรับเงิน`,
        priority: (invoices.count ?? 0) > 0 ? "HIGH" : "LOW",
      },
      {
        module: "Inventory",
        title: "ตรวจสินค้าคงเหลือต่ำ",
        description: `มีรายการ stock balance ที่ยอดคงเหลือไม่พร้อมขาย ${stockBalances.count ?? 0} รายการ`,
        priority: (stockBalances.count ?? 0) > 0 ? "NORMAL" : "LOW",
      },
      {
        module: "Marketplace",
        title: "จัดการออเดอร์ออนไลน์",
        description: `มี Marketplace order รอ fulfillment ${marketplaceOrders.count ?? 0} รายการ`,
        priority: (marketplaceOrders.count ?? 0) > 0 ? "NORMAL" : "LOW",
      },
      {
        module: "Claims",
        title: "ติดตามเคลมที่ยังเปิดอยู่",
        description: `มี Claim ที่ยังเปิดหรือตรวจสอบอยู่ ${claims.count ?? 0} รายการ`,
        priority: (claims.count ?? 0) > 0 ? "NORMAL" : "LOW",
      },
    ];

    const openInvoiceCount = invoices.count ?? 0;
    const lowStockCount = stockBalances.count ?? 0;
    const pendingMarketplaceCount = marketplaceOrders.count ?? 0;
    const openClaimCount = claims.count ?? 0;
    const focusAreas = [
      openInvoiceCount > 0 ? `Follow up ${openInvoiceCount} unpaid invoice(s)` : null,
      lowStockCount > 0 ? `Review ${lowStockCount} low or empty stock balance(s)` : null,
      pendingMarketplaceCount > 0 ? `Fulfill ${pendingMarketplaceCount} marketplace order(s)` : null,
      openClaimCount > 0 ? `Resolve ${openClaimCount} open claim(s)` : null,
    ].filter(Boolean) as string[];

    const summary: AiDashboardSummary = {
      headline: focusAreas.length ? "ERP needs operational attention" : "ERP operations look stable",
      summary: focusAreas.length
        ? `AI reviewed finance, inventory, marketplace, and claims signals. The strongest attention points are: ${focusAreas.join("; ")}.`
        : "AI reviewed the core ERP signals and did not find urgent finance, inventory, marketplace, or claim exceptions.",
      focusAreas,
    };

    return {
      conversations: (conversations.data ?? []) as AiConversationRow[],
      suggestions: (suggestions.data ?? []) as AiSuggestionRow[],
      insights,
      summary,
    };
  }

  async getConversation(companyId: string, conversationId: string) {
    const [conversation, messages] = await Promise.all([
      this.supabase
        .from("ai_conversations")
        .select("id,title,context_scope,status,updated_at,created_at")
        .eq("id", conversationId)
        .eq("company_id", companyId)
        .maybeSingle(),
      this.supabase
        .from("ai_messages")
        .select("id,role,content,created_at")
        .eq("conversation_id", conversationId)
        .order("created_at"),
    ]);

    if (conversation.error) throw conversation.error;
    if (messages.error) throw messages.error;

    return {
      conversation: conversation.data as AiConversationRow | null,
      messages: (messages.data ?? []) as AiMessageRow[],
    };
  }

  async createConversation(companyId: string, input: CreateAiConversationInput) {
    const { data, error } = await this.supabase.rpc("create_ai_conversation", {
      p_company_id: companyId,
      p_title: input.title,
      p_context_scope: input.context_scope,
      p_first_message: input.first_message,
    });

    if (error) throw error;
    return data as string;
  }

  async generateRecommendations(companyId: string) {
    const { data, error } = await this.supabase.rpc("generate_ai_recommendations", {
      p_company_id: companyId,
    });

    if (error) throw error;
    return Number(data ?? 0);
  }

  async addMessage(companyId: string, input: AddAiConversationMessageInput) {
    const { data, error } = await this.supabase.rpc("add_ai_conversation_message", {
      p_company_id: companyId,
      p_conversation_id: input.conversation_id,
      p_message: input.message,
    });

    if (error) throw error;
    return String(data);
  }
}
