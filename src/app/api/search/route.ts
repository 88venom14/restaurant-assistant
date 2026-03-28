import { NextRequest, NextResponse } from "next/server";
import { searchRestaurants } from "@/lib/2gis";
import { SearchParams } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: SearchParams = await req.json();
    if (!body.city) {
      return NextResponse.json({ error: "city is required" }, { status: 400 });
    }
    const results = await searchRestaurants(body);
    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Unknown error" }, { status: 500 });
  }
}
