/**
 * Food search backed by Open Food Facts (https://world.openfoodfacts.org),
 * a free, open nutrition database. Values are per 100 g.
 */

export type FoodResult = {
  id: string;
  name: string;
  brand?: string;
  per100g: { calories: number; protein: number; carbs: number; fat: number };
};

type OffProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  nutriments?: Record<string, number | string | undefined>;
};

const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

function num(value: number | string | undefined): number {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? (n as number) : 0;
}

function toFoodResult(p: OffProduct, fallbackId: string): FoodResult | null {
  if (!p.product_name || !p.nutriments) return null;
  const n = p.nutriments;
  return {
    id: p.code || fallbackId,
    name: p.product_name.trim(),
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    per100g: {
      calories: num(n['energy-kcal_100g']),
      protein: num(n['proteins_100g']),
      carbs: num(n['carbohydrates_100g']),
      fat: num(n['fat_100g']),
    },
  };
}

const HEADERS = { 'User-Agent': 'Kenko/1.0 (health companion app)' };

export async function searchFoods(query: string, signal?: AbortSignal): Promise<FoodResult[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '20',
    fields: 'code,product_name,brands,nutriments',
  });
  const res = await fetch(`${SEARCH_URL}?${params}`, { signal, headers: HEADERS });
  if (!res.ok) throw new Error(`Food search failed (${res.status})`);
  const json = (await res.json()) as { products?: OffProduct[] };

  return (json.products ?? [])
    .map((p, i) => toFoodResult(p, `${p.product_name}-${i}`))
    .filter((f): f is FoodResult => f !== null);
}

/** Looks up a packaged food by its barcode. Resolves to `null` if it isn't in the database. */
export async function getFoodByBarcode(barcode: string): Promise<FoodResult | null> {
  const fields = 'code,product_name,brands,nutriments';
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${fields}`,
    { headers: HEADERS },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Barcode lookup failed (${res.status})`);
  const json = (await res.json()) as { status?: number; product?: OffProduct };
  if (json.status !== 1 || !json.product) return null;
  return toFoodResult(json.product, barcode);
}

export function scaleNutrition(per100g: FoodResult['per100g'], grams: number) {
  const f = grams / 100;
  return {
    calories: Math.round(per100g.calories * f),
    protein: Math.round(per100g.protein * f * 10) / 10,
    carbs: Math.round(per100g.carbs * f * 10) / 10,
    fat: Math.round(per100g.fat * f * 10) / 10,
  };
}
