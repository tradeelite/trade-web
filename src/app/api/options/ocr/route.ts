import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const OCR_PROMPT = `Analyze this screenshot of a brokerage option trade or order. Extract the following fields from the image:

- ticker: The stock/ETF ticker symbol
- optionType: "call" or "put"
- direction: "buy" or "sell"
- strikePrice: The strike price (number)
- expiryDate: The expiration date (YYYY-MM-DD format)
- premium: The premium per contract (number)
- quantity: Number of contracts (number)
- brokerage: The brokerage name if identifiable

Return ONLY a JSON array of extracted trades. Each trade should have a "confidence" field: "high" if clearly readable, "low" if uncertain.

Example response:
[{"ticker":"AAPL","optionType":"put","direction":"sell","strikePrice":150,"expiryDate":"2025-03-21","premium":2.50,"quantity":1,"brokerage":"Schwab","confidence":"high"}]

If you cannot extract any trades, return an empty array: []`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured. Set it in .env.local" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: OCR_PROMPT },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const text = textContent && "text" in textContent ? textContent.text : "[]";

    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const trades = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json(trades);
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json(
      { error: "Failed to process screenshot" },
      { status: 500 }
    );
  }
}
