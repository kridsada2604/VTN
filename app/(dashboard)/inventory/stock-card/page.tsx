import { PageHeader } from "@/components/page-header";
import { getStockCard } from "@/lib/services/inventory/stock-service";

const movementLabel: Record<string, string> = {
  RECEIVE: "รับเข้า",
  ISSUE: "ตัดออก",
  ADJUSTMENT_IN: "ปรับปรุงเพิ่ม",
  ADJUSTMENT_OUT: "ปรับปรุงลด",
  TRANSFER_IN: "โอนเข้า",
  TRANSFER_OUT: "โอนออก",
};

export default async function Page() {
  const rows = await getStockCard();

  return (
    <div>
      <PageHeader eyebrow="INVENTORY" title="Stock Card" description="ประวัติการเคลื่อนไหวสินค้าแยกตามเอกสารและคลัง" />
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>เลขที่</th>
              <th>ประเภท</th>
              <th>คลัง</th>
              <th>สินค้า</th>
              <th>จำนวน</th>
              <th>ต้นทุน</th>
              <th>Lot/Serial</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const movement = row.stock_movements?.[0];
              const product = row.products?.[0];
              return (
                <tr key={row.id}>
                  <td>{movement?.movement_date}</td>
                  <td className="font-bold">{movement?.document_no}</td>
                  <td>{movementLabel[movement?.movement_type ?? ""] ?? movement?.movement_type}</td>
                  <td>{movement?.warehouses?.[0]?.name ?? "-"}</td>
                  <td>{product ? `${product.sku} - ${product.name}` : "-"}</td>
                  <td>{Number(row.quantity).toLocaleString("th-TH")}</td>
                  <td>฿{Number(row.unit_cost).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                  <td>{[row.lot_no, row.serial_no].filter(Boolean).join(" / ") || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-gray-500">ยังไม่มีการเคลื่อนไหวสินค้า</p>}
      </section>
    </div>
  );
}
