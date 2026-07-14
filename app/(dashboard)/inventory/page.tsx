import Link from "next/link";
import { Boxes, ClipboardList, Layers, Ruler, Tags, Warehouse } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getInventoryDashboard } from "@/lib/services/inventory/stock-service";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";

const modules = [
  ["/inventory/products", "สินค้า", "จัดการ SKU ราคา Barcode และข้อมูลพื้นฐาน", Boxes],
  ["/inventory/categories", "หมวดหมู่", "จัดกลุ่มสินค้าเพื่อค้นหาและรายงาน", Tags],
  ["/inventory/units", "หน่วยนับ", "ชิ้น กล่อง ชุด และหน่วยอื่น ๆ", Ruler],
  ["/inventory/warehouses", "คลังสินค้า", "ดูคลังแยกตามสาขา", Warehouse],
  ["/inventory/movements/new", "Stock Movement", "รับเข้า ตัดออก และปรับปรุงยอด", ClipboardList],
  ["/inventory/stock-card", "Stock Card", "ประวัติการเคลื่อนไหวสินค้า", Layers],
] as const;

const movementLabel: Record<string, string> = {
  RECEIVE: "รับเข้า",
  ISSUE: "ตัดออก",
  ADJUSTMENT_IN: "ปรับปรุงเพิ่ม",
  ADJUSTMENT_OUT: "ปรับปรุงลด",
  TRANSFER_IN: "โอนเข้า",
  TRANSFER_OUT: "โอนออก",
};

export default async function InventoryPage() {
  const { balances, movements } = await getInventoryDashboard();
  const totalQuantity = balances.reduce((sum, row) => sum + Number(row.quantity_on_hand || 0), 0);
  const totalCost = balances.reduce((sum, row) => sum + Number(row.total_cost || 0), 0);
  const lowOrEmpty = balances.filter((row) => Number(row.quantity_on_hand || 0) <= 0).length;

  return (
    <div>
      <PageHeader eyebrow="INVENTORY" title="สินค้าและสต๊อก" description="ควบคุมยอดคงเหลือ Stock Card และต้นทุนสินค้า" />

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500">รายการคงเหลือ</p>
          <p className="mt-2 text-3xl font-black">{balances.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">จำนวนรวม</p>
          <p className="mt-2 text-3xl font-black">{totalQuantity.toLocaleString("th-TH")}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">มูลค่าสต๊อก</p>
          <p className="mt-2 text-3xl font-black text-green-700">฿{formatDocumentMoney(totalCost)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">หมด/ติดศูนย์</p>
          <p className="mt-2 text-3xl font-black text-orange-700">{lowOrEmpty}</p>
        </div>
      </section>

      <section className="module-grid mt-7">
        {modules.map(([href, title, desc, Icon]) => (
          <Link href={href} key={href} className="card module-link p-5">
            <span className="inline-flex rounded-xl bg-orange-50 p-3 text-orange-600">
              <Icon size={22} />
            </span>
            <h2 className="mt-4 font-black">{title}</h2>
            <p className="mt-2 text-sm text-gray-500">{desc}</p>
          </Link>
        ))}
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="card table-wrap">
          <div className="border-b p-4">
            <h2 className="font-black">Stock Balance</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>Barcode</th>
                <th>คลัง</th>
                <th>คงเหลือ</th>
                <th>จอง</th>
                <th>ต้นทุนเฉลี่ย</th>
                <th>มูลค่า</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((row) => {
                const product = row.products?.[0];
                const warehouse = row.warehouses?.[0];
                return (
                  <tr key={row.id}>
                    <td className="font-bold">{product ? `${product.sku} - ${product.name}` : "-"}</td>
                    <td>{product?.barcode ?? "-"}</td>
                    <td>{warehouse ? `${warehouse.code} - ${warehouse.name}` : "-"}</td>
                    <td>{Number(row.quantity_on_hand).toLocaleString("th-TH")}</td>
                    <td>{Number(row.quantity_reserved).toLocaleString("th-TH")}</td>
                    <td>฿{formatDocumentMoney(row.average_cost)}</td>
                    <td className="font-bold">฿{formatDocumentMoney(row.total_cost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!balances.length && <p className="p-6 text-gray-500">ยังไม่มียอดคงเหลือ เริ่มจากบันทึก Stock Movement</p>}
        </div>

        <aside className="card p-5">
          <h2 className="font-black">Movement ล่าสุด</h2>
          <div className="mt-4 space-y-3">
            {movements.map((movement) => (
              <div key={movement.id} className="rounded-xl border border-gray-200 p-3">
                <p className="font-bold">{movement.document_no}</p>
                <p className="text-sm text-gray-500">
                  {movement.movement_date} • {movementLabel[movement.movement_type] ?? movement.movement_type}
                </p>
                <p className="mt-1 text-sm">{movement.warehouses?.[0]?.name ?? "-"}</p>
              </div>
            ))}
            {!movements.length && <p className="text-sm text-gray-500">ยังไม่มี movement</p>}
          </div>
        </aside>
      </section>
    </div>
  );
}
