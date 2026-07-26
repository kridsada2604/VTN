"use server";

import { revalidatePath } from "next/cache";
import { saveSupplier as saveSupplierService, setSupplierActive } from "@/lib/services/master/supplier-service";
import { parseMasterPartyForm, parseToggleMasterPartyForm } from "@/lib/validation/master/party";

export async function saveSupplier(fd: FormData) {
  await saveSupplierService(parseMasterPartyForm(fd, "Supplier"));
  revalidatePath("/suppliers");
}

export async function toggleSupplier(fd: FormData) {
  await setSupplierActive(parseToggleMasterPartyForm(fd, "Supplier"));
  revalidatePath("/suppliers");
}
