import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { QuotationForm } from "@/components/sales/quotation-form";
import { getCompanyTaxDefaults } from "@/lib/services/core/company-service";
import { getQuotationFormOptions } from "@/lib/services/sales/quotation-service";
import { saveQuotation } from "../actions";

export default async function Page() {
  const [{ customers, products }, taxDefaults] = await Promise.all([getQuotationFormOptions(), getCompanyTaxDefaults()]);

  return (
    <div>
      <PageHeader eyebrow="SALES" title="New Quotation" description="Create quotation with VAT profile, withholding tax, and payment installments." />
      <div className="mb-4 mt-6"><Link className="btn-secondary" href="/sales/quotations">Back to Quotations</Link></div>
      <QuotationForm customers={customers} products={products} taxDefaults={taxDefaults} action={saveQuotation} />
    </div>
  );
}
