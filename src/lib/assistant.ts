import { Message, Restaurant, SearchParams } from "@/types";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatRestaurant(r: Restaurant, idx: number, city?: string): string {
  const lines: string[] = [`${idx}. ${escapeHtml(r.name)}`];

  if (r.type) {
    lines.push(`🏪 Тип: ${escapeHtml(r.type)}`);
  }

  if (r.cuisine) {
    lines.push(`🥘 Кухня: ${escapeHtml(r.cuisine)}`);
  }

  if (r.price_level) {
    lines.push(`💰 Цена: ${escapeHtml(r.price_level)}`);
  }

  if (r.district || r.address) {
    const locationParts: string[] = [];
    if (r.district) locationParts.push(escapeHtml(r.district));
    if (r.address) {
      const address = escapeHtml(r.address);
      if (city && !address.toLowerCase().includes(city.toLowerCase())) {
        locationParts.push(`г. ${city}, ${address}`);
      } else {
        locationParts.push(address);
      }
    }
    lines.push(`📍 ${locationParts.join(" | ")}`);
  }

  if (r.rating) {
    lines.push(`⭐ Рейтинг: ${r.rating}`);
  }

  return lines.join("\n");
}

export const ACTIONS_LINE =
  "Показать ещё · Сбросить";

type Intent =
  | "reset"
  | "show_more"
  | "search"
  | "clarify";

export function detectIntent(
  text: string,
  params: Partial<SearchParams>
): Intent {
  const t = text.toLowerCase();
  if (t.includes("сбросить") || t.includes("начать заново")) return "reset";
  if (t.includes("показать ещё") || t.includes("ещё") || t.includes("еще")) return "show_more";

  if (params.city) return "search";
}

export function extractParams(
  text: string,
  current: Partial<SearchParams>
): Partial<SearchParams> {
  const result: Partial<SearchParams> = { ...current };

  const cuisinePatterns: Record<string, RegExp> = {
    "итальянская": /\bитальянск\w*\b/i,
    "японская": /\bяпонск\w*\b/i,
    "русская": /\bрусск\w*\b/i,
    "грузинская": /\bгрузинск\w*\b/i,
    "китайская": /\bкитайск\w*\b/i,
    "узбекская": /\bузбекск\w*\b/i,
    "мексиканская": /\bмексиканск\w*\b/i,
    "французская": /\bфранцузск\w*\b/i,
    "кавказская": /\bкавказск\w*\b/i,
    "азиатская": /\bазиатск\w*\b/i,
    "европейская": /\bевропейск\w*\b/i,
    "американская": /\bамериканск\w*\b/i,
    "средиземноморская": /\bсредиземноморск\w*\b/i,
    "вегетарианская": /\bвегетарианск\w*\b/i,
    "тайская": /\bтайск\w*\b/i,
    "корейская": /\bкорейск\w*\b/i,
    "индийская": /\bинд(ийск|ий)\w*\b/i,
    "бургеры": /\bбургер\w*\b/i,
    "пицца": /\bпицц\w*\b/i,
    "суши": /\bсуши\b/i,
    "морепродукты": /\b(морепродукт|seafood)\b/i,
  };
  for (const [cuisine, pattern] of Object.entries(cuisinePatterns)) {
    if (pattern.test(text)) {
      result.cuisine = cuisine;
      break;
    }
  }

  if (!result.city) {
    const words = text.match(/[а-яё]{3,}/gi);
    if (words && words.length > 0) {
      const excluded = new Set([
        "кухня", "хочу", "найти", "подобрать", "ресторан", "кафе", "столовая",
        "покажи", "найди", "ищем", "давай", "будет", "люблю", "любимый"
      ]);
      for (const word of words) {
        if (!excluded.has(word.toLowerCase())) {
          result.city = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          break;
        }
      }
    }
  }

  return result;
}

export function buildResponse(
  intent: Intent,
  restaurants: Restaurant[],
  params: Partial<SearchParams>,
  prevShown: number
): string {
  if (intent === "reset") {
    return "Привет! Помогу подобрать ресторан. Напишите город.";
  }

  if (intent === "clarify") {
    if (!params.city) return "В каком городе ищем ресторан?";
  }

  const slice = restaurants.slice(0, 5);
  if (slice.length === 0) {
    return `*По вашему запросу ничего не найдено.*

Попробуйте изменить параметры поиска.

${ACTIONS_LINE}`;
  }

  const header =
    intent === "show_more"
      ? `Ещё варианты:

`
      : `Вот ${slice.length} ресторана по вашему запросу:

`;

  const startIndex = intent === "show_more" ? prevShown : 0;
  const list = slice
    .map((r, i) => formatRestaurant(r, startIndex + i + 1, params.city))
    .join("\n─────────────────────\n");

  return `${header}${list}\n\n${ACTIONS_LINE}`;
}
