"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { upsertDealerTarget } from "@/lib/services/reports/dealer-target-service";
import { parseDealerTargetForm } from "@/lib/validation/reports/dealer-target";

export async function saveDealerTarget(fd: FormData) {
  await upsertDealerTarget(parseDealerTargetForm(fd));
  revalidatePath("/reports");
  revalidatePath("/reports/SALE_OUT");
  revalidatePath("/reports/dealer-targets");
  redirect("/reports/dealer-targets");
}
