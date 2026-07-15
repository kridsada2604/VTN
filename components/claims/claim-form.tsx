type Customer = { id: string; code: string; name: string };
type Product = { id: string; sku: string; name: string };

export function ClaimForm({ customers, products, action }: { customers: Customer[]; products: Product[]; action: (fd: FormData) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="card p-5 space-y-5">
      <div className="form-grid">
        <label><span className="label">วันที่เคลม *</span><input className="input" type="date" name="claim_date" required defaultValue={today} /></label>
        <label><span className="label">ประเภท</span><select className="input" name="claim_type" defaultValue="PRODUCT"><option value="PRODUCT">สินค้า</option><option value="SERVICE">บริการ</option><option value="WARRANTY">Warranty</option><option value="RETURN">Return</option><option value="REFUND">Refund</option></select></label>
        <label><span className="label">ลูกค้า</span><select className="input" name="customer_id" defaultValue=""><option value="">ไม่ระบุ</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.code} - {customer.name}</option>)}</select></label>
        <label><span className="label">สินค้า</span><select className="input" name="product_id" defaultValue=""><option value="">ไม่ระบุ</option>{products.map((product) => <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>)}</select></label>
        <label><span className="label">Priority</span><select className="input" name="priority" defaultValue="NORMAL"><option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label>
        <label className="full"><span className="label">หัวข้อ *</span><input className="input" name="subject" required /></label>
        <label className="full"><span className="label">รายละเอียด</span><textarea className="input textarea" name="description" /></label>
      </div>
      <button className="btn-primary">บันทึกเคลม</button>
    </form>
  );
}
