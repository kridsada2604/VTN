const scopes = ["ERP", "SALES", "INVENTORY", "ACCOUNTING", "PURCHASE", "CRM", "PROJECTS", "CLAIMS", "POS", "MARKETPLACE"] as const;

export function AiConversationForm({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action} className="card space-y-5 p-5">
      <div className="form-grid">
        <label>
          <span className="label">หัวข้อ</span>
          <input className="input" name="title" placeholder="วิเคราะห์ยอดขายวันนี้" />
        </label>
        <label>
          <span className="label">ขอบเขตข้อมูล</span>
          <select className="input" name="context_scope" defaultValue="ERP">
            {scopes.map((scope) => (
              <option key={scope} value={scope}>{scope}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span className="label">คำถามหรือคำสั่ง *</span>
        <textarea className="input textarea min-h-36" name="first_message" required placeholder="ช่วยดูว่ามีอะไรที่ควรรีบจัดการในระบบวันนี้" />
      </label>
      <button className="btn-primary">เริ่มคุยกับ AI</button>
    </form>
  );
}
