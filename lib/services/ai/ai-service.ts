import { getCurrentCompanyId } from "@/lib/current-company";
import { AiRepository } from "@/lib/repositories/ai/ai-repository";
import { createClient } from "@/lib/supabase/server";
import type { AddAiConversationMessageInput, CreateAiConversationInput } from "@/lib/validation/ai/ai";

export async function getAiDashboard() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new AiRepository(supabase).dashboard(companyId);
}

export async function getAiConversation(conversationId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new AiRepository(supabase).getConversation(companyId, conversationId);
}

export async function createAiConversation(input: CreateAiConversationInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new AiRepository(supabase).createConversation(companyId, input);
}

export async function generateAiRecommendations() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new AiRepository(supabase).generateRecommendations(companyId);
}

export async function addAiConversationMessage(input: AddAiConversationMessageInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new AiRepository(supabase).addMessage(companyId, input);
}
