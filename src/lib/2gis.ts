import { Restaurant, SearchParams } from "@/types";

const API_KEY = process.env.TWOGIS_API_KEY;
const BASE_URL = "https://catalog.api.2gis.com/3.0/items";
const RUBRIC_RESTAURANTS = "164";
const PAGE_SIZE = 10;

const cityIdCache: Record<string, string> = {};

if (!API_KEY) {
  throw new Error("TWOGIS_API_KEY не настроен. Проверьте .env.local");
}

async function getCityId(cityName: string): Promise<string | null> {
  if (cityIdCache[cityName]) {
    return cityIdCache[cityName];
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("q", cityName);
  url.searchParams.set("type", "adm_div.city");
  url.searchParams.set("fields", "items.id");
  url.searchParams.set("key", API_KEY!);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    
    const json = await res.json();
    const items = json?.result?.items ?? [];
    
    if (items.length > 0) {
      const id = items[0].id;
      cityIdCache[cityName] = id;
      return id;
    }
  } catch (e) {
    console.error("Error getting city ID:", e);
  }
  
  return null;
}

export async function searchRestaurants(
  params: SearchParams
): Promise<Restaurant[]> {
  const query = buildQuery(params);

  const cityId = await getCityId(params.city);

  const url = new URL(BASE_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("type", "branch");
  url.searchParams.set("rubric_id", RUBRIC_RESTAURANTS);

  if (cityId) {
    url.searchParams.set("city_id", cityId);
    console.log(`2GIS API: используем city_id=${cityId} для города ${params.city}`);
  } else {
    console.warn(`2GIS API: не удалось получить city_id для ${params.city}, ищем без ограничения`);
  }
  
  url.searchParams.set("page_size", String(PAGE_SIZE));
  url.searchParams.set("page", String(params.page ?? 1));
  url.searchParams.set("fields", "items.point,items.address,items.rating,items.rubrics,items.price_comment");
  url.searchParams.set("key", API_KEY!);

  console.log("2GIS API request URL:", url.toString());
  console.log("2GIS API request params:", { city: params.city, cuisine: params.cuisine, page: params.page, query, cityId });

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "нет данных");
    console.error(`2GIS API error ${res.status}:`, errorBody);
    throw new Error(`Сервис временно недоступен (ошибка ${res.status})`);
  }

  const json = await res.json();
  console.log("2GIS API response items count:", json?.result?.items?.length ?? 0);
  
  const items = json?.result?.items ?? [];

  return items.map((item: any): Restaurant => ({
    id: String(item.id),
    name: String(item.name),
    cuisine: extractCuisine(item.rubrics),
    type: extractType(item.rubrics),
    price_level: item.price_comment ?? undefined,
    district: extractDistrict(item.address),
    address: formatAddress(item.address),
    rating: item.reviews?.rating ?? undefined,
  }));
}

function extractType(rubrics?: any[]): string | undefined {
  if (!rubrics || rubrics.length === 0) return undefined;

  const typeKeywords: Record<string, string> = {
    "бары": "Бар",
    "бар": "Бар",
    "кафе": "Кафе",
    "столовые": "Столовая",
    "закусочные": "Закусочная",
    "кофейни": "Кофейня",
    "пиццерии": "Пиццерия",
    "суши-бары": "Суши-бар",
    "бургерные": "Бургерная",
    "фастфуд": "Фастфуд",
    "быстрого питания": "Фастфуд",
    "доставка": "Доставка еды",
    "кейтеринг": "Кейтеринг",
    "ресторан быстрого питания": "Фастфуд",
  };

  const allRubrics = rubrics.map(r => r.name.toLowerCase()).join(" ");
  
  for (const [key, value] of Object.entries(typeKeywords)) {
    if (allRubrics.includes(key)) {
      return value;
    }
  }

  return undefined;
}

function extractCuisine(rubrics?: any[]): string | undefined {
  if (!rubrics || rubrics.length === 0) return undefined;

  const excludedIds = new Set(["164", "2"]);

  const excludedNames = new Set([
    "Рестораны",
    "Предприятия питания",
    "Еда",
    "Бары",
    "Кафе",
    "Столовые",
    "Закусочные",
    "Кофейни",
    "Пиццерии",
    "Суши-бары",
    "Бургерные",
    "Фастфуд",
    "Доставка еды",
    "Кейтеринг",
  ]);

  const cuisineKeywords: Record<string, string> = {
    "итальянская": "Итальянская",
    "японская": "Японская",
    "русская": "Русская",
    "грузинская": "Грузинская",
    "китайская": "Китайская",
    "узбекская": "Узбекская",
    "мексиканская": "Мексиканская",
    "французская": "Французская",
    "кавказская": "Кавказская",
    "азиатская": "Азиатская",
    "европейская": "Европейская",
    "американская": "Американская",
    "средиземноморская": "Средиземноморская",
    "вегетарианская": "Вегетарианская",
    "тайская": "Тайская",
    "корейская": "Корейская",
    "индийская": "Индийская",
    "бургеры": "Бургеры",
    "пицца": "Пицца",
    "суши": "Суши",
    "морепродукты": "Морепродукты",
    "стейк": "Стейк-хаус",
    "рыба": "Морепродукты",
    "паназиатская": "Паназиатская",
  };

  const specificRubrics = rubrics.filter(
    r => !excludedIds.has(String(r.id)) && 
         !excludedIds.has(String(r.short_id)) && 
         !excludedNames.has(r.name)
  );

  const allRubrics = specificRubrics.map(r => r.name.toLowerCase()).join(" ");

  for (const [key, value] of Object.entries(cuisineKeywords)) {
    if (allRubrics.includes(key)) {
      return value;
    }
  }

  return undefined;
}

function extractDistrict(address?: any): string | undefined {
  if (!address) return undefined;
  return address.district_name ?? address.district ?? undefined;
}

function formatAddress(address?: any): string | undefined {
  if (!address) return undefined;

  if (address.full_name) {
    return address.full_name;
  }

  if (address.components && address.components.length > 0) {
    const parts: string[] = [];

    const streetNumber = address.components.find((c: any) => c.type === "street_number");
    if (streetNumber) {
      parts.push(`${streetNumber.street}, ${streetNumber.number}`);
    } else {
      const street = address.components.find((c: any) => c.type === "street");
      if (street) {
        parts.push(street.name || street.street || Object.values(street)[0]);
      }
    }
    
    return parts.join(", ") || address.address_name || undefined;
  }
  
  return address.address_name ?? undefined;
}

function buildQuery(params: SearchParams): string {
  const parts: string[] = ["ресторан"];
  if (params.cuisine) parts.push(params.cuisine);
  if (params.budget) parts.push(params.budget);
  if (params.district) parts.push(params.district);
  return parts.join(" ");
}
