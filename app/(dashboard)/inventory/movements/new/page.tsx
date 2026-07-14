import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StockMovementForm } from "@/components/inventory/stock-movement-form";
import { getStockMovementFormOptions } from "@/lib/services/inventory/stock-service";
import { postStockMovement } from "../actions";

export default async function Page() {
  const { warehouses, products } = await getStockMovementFormOptions();

  return (
    <div>
      <PageHeader eyebrow="INVENTORY" title="บันทึก Stock Movement" description="รับเข้า ตัดออก และปรับปรุงยอดคงเหลือแบบมี audit log" />
      <div className="mb-4 mt-6">
        <Link className="btn-secondary" href="/inventory">
          ← กลับ Inventory
        </Link>
      </div>
      <StockMovementForm warehouses={warehouses} products={products} action={postStockMovement} />
    </div>
  );
}
