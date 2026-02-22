import type { DataProvider } from "./types";
import { YahooProvider } from "./yahoo-provider";
import { TwelveDataProvider } from "./twelve-data-provider";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

let cachedProvider: DataProvider | null = null;
let cachedProviderName: string | null = null;

export async function getDataProvider(): Promise<DataProvider> {
  const setting = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "data_provider"))
    .get();

  const providerName = setting?.value || "yahoo";

  if (cachedProvider && cachedProviderName === providerName) {
    return cachedProvider;
  }

  switch (providerName) {
    case "twelvedata":
      cachedProvider = new TwelveDataProvider();
      break;
    case "yahoo":
    default:
      cachedProvider = new YahooProvider();
      break;
  }

  cachedProviderName = providerName;
  return cachedProvider;
}

export function invalidateProviderCache() {
  cachedProvider = null;
  cachedProviderName = null;
}
