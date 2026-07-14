export function LeadForm({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action} className="card p-5 space-y-5">
      <div className="form-grid">
        <label><span className="label">ชื่อ Lead *</span><input className="input" name="name" required /></label>
        <label><span className="label">บริษัท</span><input className="input" name="company_name" /></label>
        <label><span className="label">อีเมล</span><input className="input" type="email" name="email" /></label>
        <label><span className="label">โทรศัพท์</span><input className="input" name="phone" /></label>
        <label className="full"><span className="label">Source</span><input className="input" name="source" placeholder="เช่น Website, Facebook, Referral" /></label>
        <label className="full"><span className="label">หมายเหตุ</span><textarea className="input textarea" name="notes" /></label>
      </div>
      <button className="btn-primary">บันทึก Lead</button>
    </form>
  );
}
