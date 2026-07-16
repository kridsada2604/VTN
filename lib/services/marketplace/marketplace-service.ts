import { getCurrentCompanyId } from "@/lib/current-company";
import { MarketplaceRepository } from "@/lib/repositories/marketplace/marketplace-repository";
import { createClient } from "@/lib/supabase/server";
import type { ConvertMarketplaceOrderInput, CreateMarketplaceChannelInput, CreateMarketplaceFeeInput, ImportMarketplaceOrderInput, MapMarketplaceSkuInput } from "@/lib/validation/marketplace/marketplace";

export async function getMarketplaceDashboard() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new MarketplaceRepository(supabase).dashboard(companyId);
}

export async function getMarketplaceFormOptions() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new MarketplaceRepository(supabase).getFormOptions(companyId);
}

export async function getMarketplaceOrderDetail(orderId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new MarketplaceRepository(supabase).getOrderById(companyId, orderId);
}

export async function getUnmappedMarketplaceSkuManagement() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new MarketplaceRepository(supabase).getUnmappedSkuManagement(companyId);
}

export async function createMarketplaceChannel(input: CreateMarketplaceChannelInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new MarketplaceRepository(supabase).createChannel(companyId, input);
}

export async function importMarketplaceOrder(input: ImportMarketplaceOrderInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new MarketplaceRepository(supabase).importOrder(companyId, input);
}

export async function mapMarketplaceSku(input: MapMarketplaceSkuInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new MarketplaceRepository(supabase).mapSku(companyId, input);
}

export async function createMarketplaceFee(input: CreateMarketplaceFeeInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new MarketplaceRepository(supabase).createFee(companyId, input);
}

export async function convertMarketplaceOrder(input: ConvertMarketplaceOrderInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new MarketplaceRepository(supabase).convertOrder(companyId, input);
}
