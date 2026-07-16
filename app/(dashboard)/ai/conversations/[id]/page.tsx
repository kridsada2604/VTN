import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getAiConversation } from "@/lib/services/ai/ai-service";
import { createAiActionRequestFromForm, sendAiConversationMessage } from "../../actions";

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
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="card p-5">
            <h2 className="font-black">Follow up</h2>
            <form action={sendAiConversationMessage} className="mt-4 space-y-3">
              <input type="hidden" name="conversation_id" value={conversation.id} />
              <textarea className="input textarea" name="message" required placeholder="Ask a follow-up question or request the next ERP action." />
              <button className="btn-primary">Send Message</button>
            </form>
          </section>
          <section className="card p-5">
            <h2 className="font-black">Queue Action</h2>
            <form action={createAiActionRequestFromForm} className="mt-4 space-y-3">
              <input type="hidden" name="conversation_id" value={conversation.id} />
              <select className="input" name="module" defaultValue={conversation.context_scope === "ERP" ? "SYSTEM" : conversation.context_scope}>
                <option value="SALES">Sales</option>
                <option value="INVENTORY">Inventory</option>
                <option value="ACCOUNTING">Accounting</option>
                <option value="PURCHASE">Purchase</option>
                <option value="CRM">CRM</option>
                <option value="PROJECTS">Projects</option>
                <option value="CLAIMS">Claims</option>
                <option value="POS">POS</option>
                <option value="MARKETPLACE">Marketplace</option>
                <option value="SYSTEM">System</option>
              </select>
              <input className="input" name="action_type" placeholder="Action type เช่น CREATE_TASK" />
              <input className="input" name="title" placeholder="Action title" required />
              <textarea className="input textarea" name="description" placeholder="Summarize the proposed ERP action before approval." required />
              <textarea className="input textarea font-mono text-xs" name="payload" placeholder='{"source":"conversation"}' />
              <button className="btn-primary">Queue for Review</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
