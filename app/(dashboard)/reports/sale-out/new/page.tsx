import Link from "next/link";
import { SaleOutForm } from "@/components/sales/sale-out-form";
import { PageHeader } from "@/components/page-header";
import { getSaleOutFormOptions } from "@/lib/services/sales/sale-out-service";
import { saveSaleOutReport } from "../actions";

export default async function Page() {
  const { dealers, products, salespeople } = await getSaleOutFormOptions();

  return (
    <div>
      <PageHeader eyebrow="REPORT CENTER" title="New Sale Out Record" description="Record dealer reported sell-out by SKU, period, and salesperson." />
      <div className="my-6"><Link className="btn-secondary" href="/reports/SALE_OUT">Back to Sale Out Analysis</Link></div>
      <SaleOutForm dealers={dealers} products={products} salespeople={salespeople} action={saveSaleOutReport} />
    </div>
  );
}