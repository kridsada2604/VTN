import type { createClient } from "@/lib/supabase/server";
import type { UpdateCompanyTaxProfileInput } from "@/lib/validation/core/company-tax";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type CompanyProfile = {
  id: string;
  code: string;
  name_th: string;
  name_en: string | null;
  tax_id: string | null;
  address: string | null;
  currency_code: string;
  is_vat_registered: boolean;
  default_vat_rate: number | string;
  default_withholding_tax_rate: number | string;
  tax_invoice_name: string | null;
  tax_invoice_address: string | null;
  default_sales_tax_code_id: string | null;
  accounting_tax_codes?: { code: string; name: string; rate: number | string; tax_type: string }[] | null;
};

export type CompanyTaxDefaults = {
  is_vat_registered: boolean;
  default_vat_rate: number;
  default_withholding_tax_rate: number;
  default_sales_tax_code_id: string | null;
  default_sales_tax_code: { code: string; name: string; rate: number; tax_type: string } | null;
};

export class CompanyRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async getProfile(companyId: string) {
    const { data, error } = await this.supabase
      .from("companies")
      .select("id,code,name_th,name_en,tax_id,address,currency_code,is_vat_registered,default_vat_rate,default_withholding_tax_rate,tax_invoice_name,tax_invoice_address,default_sales_tax_code_id,accounting_tax_codes!companies_default_sales_tax_code_id_fkey(code,name,rate,tax_type)")
      .eq("id", companyId)
      .maybeSingle();

    if (error) throw error;
    return data as CompanyProfile | null;
  }

  async getTaxDefaults(companyId: string): Promise<CompanyTaxDefaults> {
    const profile = await this.getProfile(companyId);
    return {
      is_vat_registered: profile?.is_vat_registered ?? true,
      default_vat_rate: Number(profile?.default_vat_rate ?? 7),
      default_withholding_tax_rate: Number(profile?.default_withholding_tax_rate ?? 0),
      default_sales_tax_code_id: profile?.default_sales_tax_code_id ?? null,
      default_sales_tax_code: profile?.accounting_tax_codes?.[0] ? {
        code: profile.accounting_tax_codes[0].code,
        name: profile.accounting_tax_codes[0].name,
        rate: Number(profile.accounting_tax_codes[0].rate),
        tax_type: profile.accounting_tax_codes[0].tax_type,
      } : null,
    };
  }

  async updateTaxProfile(companyId: string, input: UpdateCompanyTaxProfileInput) {
    const { error } = await this.supabase.rpc("update_company_tax_profile", {
      p_company_id: companyId,
      p_is_vat_registered: input.is_vat_registered,
      p_default_vat_rate: input.default_vat_rate,
      p_default_withholding_tax_rate: input.default_withholding_tax_rate,
      p_tax_invoice_name: input.tax_invoice_name,
      p_tax_invoice_address: input.tax_invoice_address,
    });

    if (error) throw error;
  }
}