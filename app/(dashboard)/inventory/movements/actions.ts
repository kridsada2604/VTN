"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createStockMovement, createStockTransfer } from "@/lib/services/inventory/stock-service";
import { parseStockMovementForm, parseStockTransferForm } from "@/lib/validation/inventory/stock-movement";

export async function postStockMovement(fd: FormData) {
  await createStockMovement(parseStockMovementForm(fd));
  revalidatePath("/inventory");
  revalidatePath("/inventory/stock-card");
  redirect("/inventory");
}

export async function postStockTransfer(fd: FormData) {
  await createStockTransfer(parseStockTransferForm(fd));
  revalidatePath("/inventory");
  revalidatePath("/inventory/stock-card");
  redirect("/inventory");
}
