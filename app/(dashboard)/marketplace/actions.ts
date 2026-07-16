"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createMarketplaceChannel, importMarketplaceOrder, mapMarketplaceSku } from "@/lib/services/marketplace/marketplace-service";
import { parseMarketplaceChannelForm, parseMarketplaceOrderForm, parseMarketplaceSkuMappingForm } from "@/lib/validation/marketplace/marketplace";

export async function saveMarketplaceChannel(fd: FormData) {
  await createMarketplaceChannel(parseMarketplaceChannelForm(fd));
  revalidatePath("/marketplace");
  redirect("/marketplace");
}

export async function importMarketplaceOrderAction(fd: FormData) {
  const id = await importMarketplaceOrder(parseMarketplaceOrderForm(fd));
  revalidatePath("/marketplace");
  redirect(`/marketplace/orders/${id}`);
}

export async function mapMarketplaceSkuAction(fd: FormData) {
  await mapMarketplaceSku(parseMarketplaceSkuMappingForm(fd));
  revalidatePath("/marketplace");
  revalidatePath("/marketplace/unmapped");
  redirect("/marketplace/unmapped");
}
