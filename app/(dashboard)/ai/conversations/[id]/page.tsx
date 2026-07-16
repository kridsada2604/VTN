import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getAiConversation } from "@/lib/services/ai/ai-service";
import { sendAiConversationMessage } from "../../actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { conversation, messages } = await getAiConversation(id);
  if (!conversation) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="AI CONVERSATION"
        title={conversation.title}
        description={`${conversation.context_scope} / ${conversation.status}`}
      />
      <div className="mb-4 mt-6">
        <Link className="btn-secondary" href="/ai">Back to AI Assistant</Link>
      </div>

      <section className="card space-y-4 p-5">
        {messages.map((message) => (
          <div key={message.id} className={message.role === "assistant" ? "rounded-2xl bg-orange-50 p-4" : "rounded-2xl bg-slate-50 p-4"}>
            <p className="text-xs font-bold uppercase text-gray-500">{message.role}</p>
            <p className="mt-2 whitespace-pre-wrap">{message.content}</p>
            <p className="mt-3 text-xs text-gray-400">{message.created_at}</p>
          </div>
        ))}
      </section>

      {conversation.status === "OPEN" && (
        <section className="card mt-6 p-5">
          <h2 className="font-black">Follow up</h2>
          <form action={sendAiConversationMessage} className="mt-4 space-y-3">
            <input type="hidden" name="conversation_id" value={conversation.id} />
            <textarea className="input textarea" name="message" required placeholder="Ask a follow-up question or request the next ERP action." />
            <button className="btn-primary">Send Message</button>
          </form>
        </section>
      )}
    </div>
  );
}
