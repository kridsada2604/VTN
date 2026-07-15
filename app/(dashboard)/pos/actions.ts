"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { closePosSession, createPosSale, openPosSession, refundPosSale, voidPosSale } from "@/lib/services/pos/pos-sale-service";
import { parseClosePosSessionForm, parseOpenPosSessionForm, parsePosSaleAdjustmentForm, parsePosSaleForm } from "@/lib/validation/pos/pos-sale";

export async function savePosSale(fd: FormData) {
  const id = await createPosSale(parsePosSaleForm(fd));
  revalidatePath("/pos");
  revalidatePath("/inventory");
  revalidatePath("/inventory/stock-card");
  redirect(`/pos/sales/${id}`);
}

export async function openPosSessionAction(fd: FormData) {
  await openPosSession(parseOpenPosSessionForm(fd));
  revalidatePath("/pos");
  redirect("/pos");
}

export async function closePosSessionAction(fd: FormData) {
  await closePosSession(parseClosePosSessionForm(fd));
  revalidatePath("/pos");
  redirect("/pos");
}

export async function voidPosSaleAction(fd: FormData) {
  const input = parsePosSaleAdjustmentForm(fd);
  await voidPosSale(input);
  revalidatePath("/pos");
  revalidatePath(`/pos/sales/${input.sale_id}`);
  revalidatePath("/inventory");
  revalidatePath("/inventory/stock-card");
  redirect(`/pos/sales/${input.sale_id}`);
}

export async function refundPosSaleAction(fd: FormData) {
  const input = parsePosSaleAdjustmentForm(fd);
  await refundPosSale(input);
  revalidatePath("/pos");
  revalidatePath(`/pos/sales/${input.sale_id}`);
  revalidatePath("/inventory");
  revalidatePath("/inventory/stock-card");
  redirect(`/pos/sales/${input.sale_id}`);
}
