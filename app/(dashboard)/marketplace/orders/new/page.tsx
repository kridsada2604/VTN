import Link from "next/link";
import { MarketplaceOrderForm } from "@/components/marketplace/marketplace-order-form";
import { PageHeader } from "@/components/page-header";
import { getMarketplaceFormOptions } from "@/lib/services/marketplace/marketplace-service";
import { importMarketplaceOrderAction } from "../../actions";

export default async function Page() {
  const { channels, products } = await getMarketplaceFormOptions();

  return (
    <div>
      <PageHeader eyebrow="MARKETPLACE" title="Import Order" description="นำเข้าออเดอร์จาก Marketplace และเตรียม mapping สินค้า" />
      <div className="mb-4 mt-6"><Link className="btn-secondary" href="/marketplace">← กลับ Marketplace</Link></div>
      <MarketplaceOrderForm channels={channels} products={products} action={importMarketplaceOrderAction} />
    </div>
  );
}
