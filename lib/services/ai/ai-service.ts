import { getCurrentCompanyId } from "@/lib/current-company";
import { AiRepository } from "@/lib/repositories/ai/ai-repository";
import { createClient } from "@/lib/supabase/server";
import type {
  AddAiConversationMessageInput,
  CreateAiActionRequestInput,
  CreateAiConversationInput,
  ReviewAiActionRequestInput,
} from "@/lib/validation/ai/ai";

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

  const { error } = await supabase.functions.invoke("ai-provider", {
    body: {
      conversation_id: input.conversation_id,
      message: input.message,
    },
  });

  if (!error) return input.conversation_id;

  return new AiRepository(supabase).addMessage(companyId, input);
}

export async function createAiActionRequest(input: CreateAiActionRequestInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new AiRepository(supabase).createActionRequest(companyId, input);
}

export async function reviewAiActionRequest(input: ReviewAiActionRequestInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new AiRepository(supabase).reviewActionRequest(companyId, input);
}
