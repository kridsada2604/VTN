"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addAiConversationMessage,
  createAiActionRequest,
  createAiConversation,
  generateAiRecommendations,
  reviewAiActionRequest,
} from "@/lib/services/ai/ai-service";
import {
  parseAiActionRequestForm,
  parseAiActionReviewForm,
  parseAiConversationForm,
  parseAiConversationMessageForm,
} from "@/lib/validation/ai/ai";

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

export async function createAiActionRequestFromForm(fd: FormData) {
  const input = parseAiActionRequestForm(fd);
  await createAiActionRequest(input);
  revalidatePath("/ai");
  if (input.conversation_id) revalidatePath(`/ai/conversations/${input.conversation_id}`);
  redirect(input.conversation_id ? `/ai/conversations/${input.conversation_id}` : "/ai");
}

export async function reviewAiActionRequestFromForm(fd: FormData) {
  await reviewAiActionRequest(parseAiActionReviewForm(fd));
  revalidatePath("/ai");
  redirect("/ai");
}
