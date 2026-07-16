"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  convertMarketplaceOrder,
  createMarketplaceChannel,
  createMarketplaceFee,
  importMarketplaceOrder,
  mapMarketplaceSku,
  triggerMarketplaceSync,
} from "@/lib/services/marketplace/marketplace-service";
import {
  parseMarketplaceChannelForm,
  parseMarketplaceConvertForm,
  parseMarketplaceFeeForm,
  parseMarketplaceOrderForm,
  parseMarketplaceSkuMappingForm,
  parseMarketplaceSyncForm,
} from "@/lib/validation/marketplace/marketplace";

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

export async function createMarketplaceFeeAction(fd: FormData) {
  const input = parseMarketplaceFeeForm(fd);
  await createMarketplaceFee(input);
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/orders/${input.order_id}`);
  redirect(`/marketplace/orders/${input.order_id}`);
}

export async function convertMarketplaceOrderAction(fd: FormData) {
  const input = parseMarketplaceConvertForm(fd);
  const result = await convertMarketplaceOrder(input);
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/orders/${input.order_id}`);
  revalidatePath("/sales/orders");
  revalidatePath("/inventory");

  if (result.sales_order_id) redirect(`/sales/orders/${result.sales_order_id}`);
  redirect(`/marketplace/orders/${input.order_id}`);
}

export async function syncMarketplaceChannelAction(fd: FormData) {
  await triggerMarketplaceSync(parseMarketplaceSyncForm(fd));
  revalidatePath("/marketplace");
  redirect("/marketplace");
}
