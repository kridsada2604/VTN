import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StockTransferForm } from "@/components/inventory/stock-transfer-form";
import { getStockMovementFormOptions } from "@/lib/services/inventory/stock-service";
import { postStockTransfer } from "../../movements/actions";

export default async function Page() {
  const { warehouses, products } = await getStockMovementFormOptions();

  return (
    <div>
      <PageHeader
        eyebrow="INVENTORY"
        title="Warehouse Transfer"
        description="Move stock between warehouses with paired transfer-out and transfer-in movements."
      />
      <div className="mb-4 mt-6">
        <Link className="btn-secondary" href="/inventory">Back to Inventory</Link>
      </div>
      <StockTransferForm warehouses={warehouses} products={products} action={postStockTransfer} />
    </div>
  );
}
