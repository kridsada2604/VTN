"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addAiConversationMessage, createAiConversation, generateAiRecommendations } from "@/lib/services/ai/ai-service";
import { parseAiConversationForm, parseAiConversationMessageForm } from "@/lib/validation/ai/ai";

export async function startAiConversation(fd: FormData) {
  const id = await createAiConversation(parseAiConversationForm(fd));
  revalidatePath("/ai");
  redirect(`/ai/conversations/${id}`);
}

export async function generateAiRecommendationQueue() {
  await generateAiRecommendations();
  revalidatePath("/ai");
  redirect("/ai");
}

export async function sendAiConversationMessage(fd: FormData) {
  const input = parseAiConversationMessageForm(fd);
  await addAiConversationMessage(input);
  revalidatePath("/ai");
  revalidatePath(`/ai/conversations/${input.conversation_id}`);
  redirect(`/ai/conversations/${input.conversation_id}`);
}
