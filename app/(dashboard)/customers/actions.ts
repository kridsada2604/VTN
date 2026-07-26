"use server";

import { revalidatePath } from "next/cache";
import { saveCustomer as saveCustomerService, setCustomerActive } from "@/lib/services/master/customer-service";
import { parseMasterPartyForm, parseToggleMasterPartyForm } from "@/lib/validation/master/party";

export async function saveCustomer(fd: FormData) {
  await saveCustomerService(parseMasterPartyForm(fd, "Customer"));
  revalidatePath("/customers");
}

export async function toggleCustomer(fd: FormData) {
  await setCustomerActive(parseToggleMasterPartyForm(fd, "Customer"));
  revalidatePath("/customers");
}
