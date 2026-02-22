import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

export const portfolios = sqliteTable("portfolios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const holdings = sqliteTable(
  "holdings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    portfolioId: integer("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    shares: real("shares").notNull(),
    avgCost: real("avg_cost").notNull(),
    addedAt: integer("added_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("unique_holding").on(table.portfolioId, table.ticker),
  ]
);

export const optionTrades = sqliteTable("option_trades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticker: text("ticker").notNull(),
  optionType: text("option_type").notNull(),
  direction: text("direction").notNull(),
  strikePrice: real("strike_price").notNull(),
  expiryDate: text("expiry_date").notNull(),
  premium: real("premium").notNull(),
  quantity: integer("quantity").notNull(),
  brokerage: text("brokerage"),
  status: text("status").notNull().default("open"),
  closePremium: real("close_premium"),
  closeDate: text("close_date"),
  notes: text("notes"),
  source: text("source").notNull().default("manual"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const ocrUploads = sqliteTable("ocr_uploads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  status: text("status").notNull().default("pending"),
  extractedData: text("extracted_data"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
