import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/sales/invoice-form";
import { getInvoiceFormOptions } from "@/lib/services/sales/invoice-service";
import { saveInvoice } from "../actions";

export default async function Page() {
  const { customers, products } = await getInvoiceFormOptions();

  return (
    <div>
      <PageHeader eyebrow="SALES" title="สร้างใบแจ้งหนี้" description="เลือกลูกค้าและเพิ่มรายการสินค้าเพื่อออกเอกสาร" />
      <div className="mb-4 mt-6">
        <Link className="btn-secondary" href="/sales/invoices">
          ← กลับรายการ
        </Link>
      </div>
      <InvoiceForm customers={customers} products={products} action={saveInvoice} />
    </div>
  );
}
