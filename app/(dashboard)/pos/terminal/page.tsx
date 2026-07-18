import { PosTerminal } from "@/components/pos/pos-terminal";
import { getCompanyTaxDefaults } from "@/lib/services/core/company-service";
import { getPosSaleFormOptions } from "@/lib/services/pos/pos-sale-service";
import { savePosSale } from "../actions";

export default async function Page() {
  const [{ customers, products, warehouses }, taxDefaults] = await Promise.all([getPosSaleFormOptions(), getCompanyTaxDefaults()]);
  return <PosTerminal customers={customers} products={products} warehouses={warehouses} taxDefaults={taxDefaults} action={savePosSale} />;
}
