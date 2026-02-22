import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { invalidateProviderCache } from "@/lib/data-providers/provider-factory";

export async function GET() {
  try {
    const settings = await db.select().from(appSettings).all();
    const settingsObj: Record<string, string> = {};
    for (const s of settings) {
      settingsObj[s.key] = s.value;
    }
    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "key and value required" },
        { status: 400 }
      );
    }

    await db
      .insert(appSettings)
      .values({ key, value: String(value) })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: String(value) },
      });

    if (key === "data_provider") {
      invalidateProviderCache();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}
