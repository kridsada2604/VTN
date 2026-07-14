import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PurchaseReceiveForm } from "@/components/purchase/purchase-receive-form";
import { getPurchaseReceiveOptions } from "@/lib/services/purchase/purchase-order-service";
import { receivePurchaseOrderAction } from "../../actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { order, items, warehouses } = await getPurchaseReceiveOptions(id);
  if (!order) notFound();

  return (
    <div>
      <PageHeader eyebrow="PURCHASE" title={`รับสินค้า ${order.document_no}`} description="รับสินค้าเข้าคลังและสร้าง Stock Movement อัตโนมัติ" />
      <div className="mb-4 mt-6"><Link className="btn-secondary" href={`/purchase/orders/${id}`}>← กลับ PO</Link></div>
      <PurchaseReceiveForm purchaseOrderId={id} warehouses={warehouses} items={items} action={receivePurchaseOrderAction} />
    </div>
  );
}
