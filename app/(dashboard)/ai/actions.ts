"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAiConversation, generateAiRecommendations } from "@/lib/services/ai/ai-service";
import { parseAiConversationForm } from "@/lib/validation/ai/ai";

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
