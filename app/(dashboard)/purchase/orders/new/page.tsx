import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PurchaseOrderForm } from "@/components/purchase/purchase-order-form";
import { getCompanyTaxDefaults } from "@/lib/services/core/company-service";
import { getPurchaseOrderFormOptions } from "@/lib/services/purchase/purchase-order-service";
import { savePurchaseOrder } from "../actions";

export default async function Page() {
  const [{ suppliers, products }, taxDefaults] = await Promise.all([getPurchaseOrderFormOptions(), getCompanyTaxDefaults()]);

  return (
    <div>
      <PageHeader eyebrow="PURCHASE" title="สร้างใบสั่งซื้อ" description="เลือก Supplier และเพิ่มรายการสินค้า" />
      <div className="mb-4 mt-6"><Link className="btn-secondary" href="/purchase/orders">← กลับรายการ</Link></div>
      <PurchaseOrderForm suppliers={suppliers} products={products} taxDefaults={taxDefaults} action={savePurchaseOrder} />
    </div>
  );
}
