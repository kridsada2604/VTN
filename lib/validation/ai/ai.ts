export type CreateAiConversationInput = {
  title: string | null;
  context_scope: string;
  first_message: string;
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
