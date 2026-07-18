export type UpdateCompanyTaxProfileInput = {
  is_vat_registered: boolean;
  default_vat_rate: number;
  default_withholding_tax_rate: number;
  tax_invoice_name: string | null;
  tax_invoice_address: string | null;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parseCompanyTaxProfileForm(fd: FormData): UpdateCompanyTaxProfileInput {
  const isVatRegistered = text(fd, "is_vat_registered") === "true";
  const input: UpdateCompanyTaxProfileInput = {
    is_vat_registered: isVatRegistered,
    default_vat_rate: isVatRegistered ? numberOrZero(fd.get("default_vat_rate")) : 0,
    default_withholding_tax_rate: numberOrZero(fd.get("default_withholding_tax_rate")),
    tax_invoice_name: text(fd, "tax_invoice_name") || null,
    tax_invoice_address: text(fd, "tax_invoice_address") || null,
  };

  if (input.default_vat_rate < 0 || input.default_vat_rate > 100) throw new Error("VAT rate must be between 0 and 100");
  if (input.default_withholding_tax_rate < 0 || input.default_withholding_tax_rate > 100) throw new Error("Withholding tax rate must be between 0 and 100");

  return input;
}