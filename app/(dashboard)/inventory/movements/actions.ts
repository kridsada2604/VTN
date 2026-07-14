"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createStockMovement } from "@/lib/services/inventory/stock-service";
import { parseStockMovementForm } from "@/lib/validation/inventory/stock-movement";

export async function postStockMovement(fd: FormData) {
  await createStockMovement(parseStockMovementForm(fd));
  revalidatePath("/inventory");
  revalidatePath("/inventory/stock-card");
  redirect("/inventory");
}
