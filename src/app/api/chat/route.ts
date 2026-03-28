import { NextRequest, NextResponse } from "next/server";
import { detectIntent, extractParams, buildResponse } from "@/lib/assistant";
import { searchRestaurants } from "@/lib/2gis";
import { SearchParams, Restaurant } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { message, params: rawParams, prevShown } = await req.json();

    const params: Partial<SearchParams> = rawParams ?? {};
    const updatedParams = extractParams(message, params);
    const intent = detectIntent(message, updatedParams);

    let restaurants: Restaurant[] = [];
    let nextShown = prevShown ?? 0;

    if (intent === "reset") {
      return NextResponse.json({
        reply: buildResponse("reset", [], {}, 0),
        params: {},
        prevShown: 0,
        restaurants: [],
      });
    }

    if (
      (intent === "search" || intent === "show_more") &&
      updatedParams.city
    ) {
      const currentShown = intent === "show_more" ? (prevShown ?? 0) + 5 : 0;
      const page = Math.floor(currentShown / 10) + 1;

      restaurants = await searchRestaurants({
        ...(updatedParams as SearchParams),
        page,
      });

      nextShown = restaurants.length > 0 ? currentShown + restaurants.length : prevShown;
    }

    const responsePrevShown = intent === "show_more" ? prevShown : 0;
    const reply = buildResponse(intent, restaurants, updatedParams, responsePrevShown);

    return NextResponse.json({
      reply,
      params: updatedParams,
      prevShown: nextShown,
      restaurants,
    });
  } catch (e: any) {
    console.error("API Error:", e);
    console.error("Stack:", e.stack);
    return NextResponse.json({ error: e.message ?? "Unknown error" }, { status: 500 });
  }
}
