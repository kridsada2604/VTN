import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getAiConversation } from "@/lib/services/ai/ai-service";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { conversation, messages } = await getAiConversation(id);
  if (!conversation) notFound();

  return (
    <div>
      <PageHeader eyebrow="AI CONVERSATION" title={conversation.title} description={`${conversation.context_scope} · ${conversation.status}`} />
      <div className="mb-4 mt-6"><Link className="btn-secondary" href="/ai">← กลับ AI Assistant</Link></div>
      <section className="card space-y-4 p-5">
        {messages.map((message) => (
          <div key={message.id} className={message.role === "assistant" ? "rounded-2xl bg-orange-50 p-4" : "rounded-2xl bg-slate-50 p-4"}>
            <p className="text-xs font-bold uppercase text-gray-500">{message.role}</p>
            <p className="mt-2 whitespace-pre-wrap">{message.content}</p>
            <p className="mt-3 text-xs text-gray-400">{message.created_at}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
