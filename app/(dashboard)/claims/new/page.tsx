import Link from "next/link";
import { ClaimForm } from "@/components/claims/claim-form";
import { PageHeader } from "@/components/page-header";
import { getClaimFormOptions } from "@/lib/services/claims/claim-service";
import { saveClaim } from "../actions";

export default async function Page() {
  const { customers, products } = await getClaimFormOptions();
  return (
    <div>
      <PageHeader eyebrow="CLAIMS" title="สร้าง Claim" description="บันทึกเคลมและติดตามการแก้ไข" />
      <div className="mb-4 mt-6"><Link className="btn-secondary" href="/claims">← กลับรายการ</Link></div>
      <ClaimForm customers={customers} products={products} action={saveClaim} />
    </div>
  );
}
