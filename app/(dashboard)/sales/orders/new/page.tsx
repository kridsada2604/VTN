import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { SalesOrderForm } from "@/components/sales/sales-order-form";
import { getSalesOrderFormOptions } from "@/lib/services/sales/sales-order-service";
import { saveSalesOrder } from "../actions";

export default async function Page() {
  const { customers, products, warehouses } = await getSalesOrderFormOptions();

  return (
    <div>
      <PageHeader eyebrow="SALES" title="สร้าง Sales Order" description="เลือกลูกค้า สินค้า และคลังสำหรับจองสต๊อก" />
      <div className="mb-4 mt-6"><Link className="btn-secondary" href="/sales/orders">← กลับรายการ</Link></div>
      <SalesOrderForm customers={customers} products={products} warehouses={warehouses} action={saveSalesOrder} />
    </div>
  );
}
