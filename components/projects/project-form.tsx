type Customer = { id: string; code: string; name: string };

export function ProjectForm({ customers, action }: { customers: Customer[]; action: (fd: FormData) => void }) {
  return (
    <form action={action} className="card p-5 space-y-5">
      <div className="form-grid">
        <label className="full"><span className="label">ชื่อโครงการ *</span><input className="input" name="name" required /></label>
        <label><span className="label">ลูกค้า</span><select className="input" name="customer_id" defaultValue=""><option value="">ไม่ระบุ</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.code} - {customer.name}</option>)}</select></label>
        <label><span className="label">งบประมาณ</span><input className="input" type="number" min="0" step="0.01" name="budget_amount" defaultValue={0} /></label>
        <label><span className="label">วันที่เริ่ม</span><input className="input" type="date" name="start_date" /></label>
        <label><span className="label">วันที่จบ</span><input className="input" type="date" name="end_date" /></label>
        <label className="full"><span className="label">หมายเหตุ</span><textarea className="input textarea" name="notes" /></label>
      </div>
      <button className="btn-primary">บันทึกโครงการ</button>
    </form>
  );
}
