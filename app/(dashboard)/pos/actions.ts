"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPosSale } from "@/lib/services/pos/pos-sale-service";
import { parsePosSaleForm } from "@/lib/validation/pos/pos-sale";

export async function savePosSale(fd: FormData) {
  const id = await createPosSale(parsePosSaleForm(fd));
  revalidatePath("/pos");
  revalidatePath("/inventory");
  revalidatePath("/inventory/stock-card");
  redirect(`/pos/sales/${id}`);
}
