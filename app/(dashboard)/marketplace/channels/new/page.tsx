import Link from "next/link";
import { MarketplaceChannelForm } from "@/components/marketplace/marketplace-channel-form";
import { PageHeader } from "@/components/page-header";
import { saveMarketplaceChannel } from "../../actions";

export default async function Page() {
  return (
    <div>
      <PageHeader eyebrow="MARKETPLACE" title="เพิ่มช่องทางขาย" description="สร้างช่องทาง Marketplace เพื่อรับออเดอร์ออนไลน์" />
      <div className="mb-4 mt-6"><Link className="btn-secondary" href="/marketplace">← กลับ Marketplace</Link></div>
      <MarketplaceChannelForm action={saveMarketplaceChannel} />
    </div>
  );
}
