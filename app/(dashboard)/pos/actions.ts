"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { closePosSession, createPosSale, openPosSession } from "@/lib/services/pos/pos-sale-service";
import { parseClosePosSessionForm, parseOpenPosSessionForm, parsePosSaleForm } from "@/lib/validation/pos/pos-sale";

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
