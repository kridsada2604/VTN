import { PageHeader } from "@/components/page-header";
import { getCompanyProfile } from "@/lib/services/core/company-service";
import { saveCompanyTaxProfile } from "./actions";

export default async function CompanyPage() {
  const company = await getCompanyProfile();

  return (
    <div>
      <PageHeader eyebrow="SETTINGS" title="Company Profile" description="Company legal and tax settings used by sales, invoices, and accounting." />
      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="card p-6">
          <h2 className="font-black">Company Information</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <Item label="Company Code" value={company?.code} />
            <Item label="Thai Name" value={company?.name_th} />
            <Item label="English Name" value={company?.name_en} />
            <Item label="Tax ID" value={company?.tax_id} />
            <Item label="Currency" value={company?.currency_code} />
            <Item label="VAT Status" value={company?.is_vat_registered ? "VAT registered" : "Not VAT registered"} />
            <Item label="Sales Tax Code" value={company?.accounting_tax_codes?.[0]?.code ? `${company.accounting_tax_codes[0].code} - ${company.accounting_tax_codes[0].name}` : "-"} />
          </dl>
        </div>

        <form action={saveCompanyTaxProfile} className="card p-6 space-y-4">
          <h2 className="font-black">Tax Profile</h2>
          <label>
            <span className="label">VAT Registration</span>
            <select className="input" name="is_vat_registered" defaultValue={String(company?.is_vat_registered ?? true)}>
              <option value="true">VAT registered</option>
              <option value="false">Not VAT registered</option>
            </select>
          </label>
          <label>
            <span className="label">Default VAT Rate (%)</span>
            <input className="input" type="number" min="0" max="100" step="0.01" name="default_vat_rate" defaultValue={Number(company?.default_vat_rate ?? 7)} />
          </label>
          <label>
            <span className="label">Default Withholding Tax Rate (%)</span>
            <input className="input" type="number" min="0" max="100" step="0.01" name="default_withholding_tax_rate" defaultValue={Number(company?.default_withholding_tax_rate ?? 0)} />
          </label>
          <label>
            <span className="label">Tax Invoice Name</span>
            <input className="input" name="tax_invoice_name" defaultValue={company?.tax_invoice_name ?? company?.name_th ?? ""} />
          </label>
          <label>
            <span className="label">Tax Invoice Address</span>
            <textarea className="input textarea" name="tax_invoice_address" defaultValue={company?.tax_invoice_address ?? company?.address ?? ""} />
          </label>
          <button className="btn-primary">Save Tax Profile</button>
        </form>
      </section>
    </div>
  );
}

function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-1 font-bold">{value || "-"}</dd>
    </div>
  );
}