export interface OptionTrade {
  id: number;
  ticker: string;
  optionType: "call" | "put";
  direction: "buy" | "sell";
  strikePrice: number;
  expiryDate: string;
  premium: number;
  quantity: number;
  brokerage: string | null;
  status: "open" | "closed";
  closePremium: number | null;
  closeDate: string | null;
  notes: string | null;
  source: "manual" | "ocr";
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtractedTrade {
  ticker: string;
  optionType: "call" | "put";
  direction: "buy" | "sell";
  strikePrice: number;
  expiryDate: string;
  premium: number;
  quantity: number;
  brokerage: string | null;
  confidence: "high" | "low";
}

export interface Suggestion {
  tradeId: number;
  ticker: string;
  action: "close" | "roll" | "alert";
  reason: string;
  urgency: "high" | "medium" | "low";
  details: string;
}

export type DteUrgency = "critical" | "warning" | "safe" | "comfortable";
