export type SaveProductInput = {
  id: string | null;
  sku: string;
  name: string;
  barcode: string | null;
  category_id: string | null;
  unit_id: string | null;
  cost_price: number;
  selling_price: number;
};

export type ToggleProductInput = {
  id: string;
  next: boolean;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parseProductForm(fd: FormData): SaveProductInput {
  const input: SaveProductInput = {
    id: text(fd, "id") || null,
    sku: text(fd, "sku"),
    name: text(fd, "name"),
    barcode: text(fd, "barcode") || null,
    category_id: text(fd, "category_id") || null,
    unit_id: text(fd, "unit_id") || null,
    cost_price: numberOrZero(fd.get("cost_price")),
    selling_price: numberOrZero(fd.get("selling_price")),
  };

  if (!input.sku || !input.name) throw new Error("Product SKU and name are required");
  if (input.cost_price < 0 || input.selling_price < 0) throw new Error("Product prices must not be negative");
  return input;
}

export function parseToggleProductForm(fd: FormData): ToggleProductInput {
  const input = {
    id: text(fd, "id"),
    next: text(fd, "next") === "true",
  };

  if (!input.id) throw new Error("Product is required");
  return input;
}
