import Link from "next/link";
import { SaleOutForm } from "@/components/sales/sale-out-form";
import { PageHeader } from "@/components/page-header";
import { getSaleOutFormOptions } from "@/lib/services/sales/sale-out-service";
import { saveSaleOutReport } from "../actions";

export default async function Page() {
  const { dealers, products, salespeople } = await getSaleOutFormOptions();

  return (
    <div>
      <PageHeader eyebrow="SALES" title="New Sale Out" description="Record dealer reported sell-out by SKU, period, and salesperson." />
      <div className="my-6"><Link className="btn-secondary" href="/sales/sale-out">Back to Sale Out</Link></div>
      <SaleOutForm dealers={dealers} products={products} salespeople={salespeople} action={saveSaleOutReport} />
    </div>
  );
}
