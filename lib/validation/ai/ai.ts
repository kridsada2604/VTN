export type CreateAiConversationInput = {
  title: string | null;
  context_scope: string;
  first_message: string;
};

export type AddAiConversationMessageInput = {
  conversation_id: string;
  message: string;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export function parseAiConversationForm(fd: FormData): CreateAiConversationInput {
  const input = {
    title: text(fd, "title") || null,
    context_scope: text(fd, "context_scope") || "ERP",
    first_message: text(fd, "first_message"),
  };

  if (!input.first_message) throw new Error("กรุณาพิมพ์คำถามหรือคำสั่งให้ AI Assistant");

  return input;
}

export function parseAiConversationMessageForm(fd: FormData): AddAiConversationMessageInput {
  const input = {
    conversation_id: text(fd, "conversation_id"),
    message: text(fd, "message"),
  };

  if (!input.conversation_id) throw new Error("AI conversation is required");
  if (!input.message) throw new Error("Message is required");

  return input;
}
