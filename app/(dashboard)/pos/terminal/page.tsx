import { PosTerminal } from "@/components/pos/pos-terminal";
import { getPosSaleFormOptions } from "@/lib/services/pos/pos-sale-service";
import { savePosSale } from "../actions";

export default async function Page() {
  const { customers, products, warehouses } = await getPosSaleFormOptions();
  return <PosTerminal customers={customers} products={products} warehouses={warehouses} action={savePosSale} />;
}
