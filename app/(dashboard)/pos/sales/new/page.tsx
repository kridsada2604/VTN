import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PosSaleForm } from "@/components/pos/pos-sale-form";
import { getCompanyTaxDefaults } from "@/lib/services/core/company-service";
import { getPosSaleFormOptions } from "@/lib/services/pos/pos-sale-service";
import { savePosSale } from "../../actions";

export default async function Page() {
  const [{ customers, products, warehouses }, taxDefaults] = await Promise.all([getPosSaleFormOptions(), getCompanyTaxDefaults()]);

  return (
    <div>
      <PageHeader eyebrow="POS" title="เปิดบิล POS" description="เลือกสินค้า รับชำระเงิน และตัดสต๊อกทันที" />
      <div className="mb-4 mt-6"><Link className="btn-secondary" href="/pos">← กลับ POS</Link></div>
      <PosSaleForm customers={customers} products={products} warehouses={warehouses} taxDefaults={taxDefaults} action={savePosSale} />
    </div>
  );
}
