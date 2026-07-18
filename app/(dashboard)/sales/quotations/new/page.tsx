import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { QuotationForm } from "@/components/sales/quotation-form";
import { getCompanyTaxDefaults } from "@/lib/services/core/company-service";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/current-company";
import { saveQuotation } from "../actions";

export default async function Page() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const [customers, products, taxDefaults] = await Promise.all([
    supabase.from("customers").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
    supabase.from("products").select("id,sku,name,selling_price").eq("company_id", companyId).eq("is_active", true).order("name"),
    getCompanyTaxDefaults(),
  ]);

  if (customers.error) throw customers.error;
  if (products.error) throw products.error;

  return (
    <div>
      <PageHeader eyebrow="SALES" title="New Quotation" description="Create quotation with VAT profile, withholding tax, and payment installments." />
      <div className="mb-4 mt-6"><Link className="btn-secondary" href="/sales/quotations">Back to Quotations</Link></div>
      <QuotationForm customers={customers.data ?? []} products={(products.data ?? []).map((product) => ({ ...product, selling_price: Number(product.selling_price) }))} taxDefaults={taxDefaults} action={saveQuotation} />
    </div>
  );
}