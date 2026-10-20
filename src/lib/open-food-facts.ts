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

export async function searchFoods(query: string, signal?: AbortSignal): Promise<FoodResult[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '20',
    fields: 'code,product_name,brands,nutriments',
  });
  const res = await fetch(`${SEARCH_URL}?${params}`, {
    signal,
    headers: { 'User-Agent': 'Kenko/1.0 (health companion app)' },
  });
  if (!res.ok) throw new Error(`Food search failed (${res.status})`);
  const json = (await res.json()) as { products?: OffProduct[] };

  return (json.products ?? [])
    .filter((p) => p.product_name && p.nutriments)
    .map((p, i) => {
      const n = p.nutriments!;
      return {
        id: p.code || `${p.product_name}-${i}`,
        name: p.product_name!.trim(),
        brand: p.brands?.split(',')[0]?.trim() || undefined,
        per100g: {
          calories: num(n['energy-kcal_100g']),
          protein: num(n['proteins_100g']),
          carbs: num(n['carbohydrates_100g']),
          fat: num(n['fat_100g']),
        },
      };
    });
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
