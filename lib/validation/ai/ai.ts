export type CreateAiConversationInput = {
  title: string | null;
  context_scope: string;
  first_message: string;
};

export type AddAiConversationMessageInput = {
  conversation_id: string;
  message: string;
};

export type CreateAiActionRequestInput = {
  conversation_id: string | null;
  module: string;
  action_type: string;
  title: string;
  description: string;
  payload: Record<string, unknown>;
};

export type ReviewAiActionRequestInput = {
  action_request_id: string;
  decision: "APPROVED" | "REJECTED" | "CANCELLED";
  review_note: string | null;
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

export function parseAiActionRequestForm(fd: FormData): CreateAiActionRequestInput {
  const payloadText = text(fd, "payload");
  let payload: Record<string, unknown> = {};

  if (payloadText) {
    try {
      const parsed = JSON.parse(payloadText) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Payload must be an object");
      payload = parsed as Record<string, unknown>;
    } catch {
      throw new Error("Payload must be valid JSON object");
    }
  }

  const input = {
    conversation_id: text(fd, "conversation_id") || null,
    module: (text(fd, "module") || "SYSTEM").toUpperCase(),
    action_type: (text(fd, "action_type") || "REVIEW").toUpperCase(),
    title: text(fd, "title"),
    description: text(fd, "description"),
    payload,
  };

  if (!input.title) throw new Error("Action request title is required");
  if (!input.description) throw new Error("Action request description is required");

  return input;
}

export function parseAiActionReviewForm(fd: FormData): ReviewAiActionRequestInput {
  const decision = text(fd, "decision").toUpperCase();
  if (!["APPROVED", "REJECTED", "CANCELLED"].includes(decision)) throw new Error("Invalid action request decision");

  const input = {
    action_request_id: text(fd, "action_request_id"),
    decision: decision as ReviewAiActionRequestInput["decision"],
    review_note: text(fd, "review_note") || null,
  };

  if (!input.action_request_id) throw new Error("Action request is required");

  return input;
}
