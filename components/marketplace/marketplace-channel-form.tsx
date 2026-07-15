const platforms = [
  ["SHOPEE", "Shopee"],
  ["LAZADA", "Lazada"],
  ["TIKTOK", "TikTok Shop"],
  ["FACEBOOK", "Facebook"],
  ["LINE_SHOPPING", "LINE Shopping"],
  ["OTHER", "Other"],
] as const;

export function MarketplaceChannelForm({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action} className="card space-y-5 p-5">
      <div className="form-grid">
        <label>
          <span className="label">ชื่อร้าน *</span>
          <input className="input" name="name" required placeholder="VTN Official Store" />
        </label>
        <label>
          <span className="label">แพลตฟอร์ม *</span>
          <select className="input" name="platform" required defaultValue="SHOPEE">
            {platforms.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">รหัสร้าน *</span>
          <input className="input" name="shop_code" required placeholder="SHOP-001" />
        </label>
      </div>
      <button className="btn-primary">บันทึกช่องทาง</button>
    </form>
  );
}
