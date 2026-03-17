import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://tradeelite.ai"),
  title: "TradeElite.AI | AI-Powered Trading Intelligence",
  description:
    "Analyze stocks, options, and portfolios with AI-driven technical, fundamental, and news insights in one platform.",
  icons: { icon: "/favicon.png" },
  openGraph: {
    type: "website",
    url: "https://tradeelite.ai",
    siteName: "TradeElite.AI",
    title: "TradeElite.AI | AI-Powered Trading Intelligence",
    description:
      "Analyze stocks, options, and portfolios with AI-driven technical, fundamental, and news insights in one platform.",
    images: [{ url: "/logo@2x.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeElite.AI | AI-Powered Trading Intelligence",
    description:
      "Analyze stocks, options, and portfolios with AI-driven technical, fundamental, and news insights in one platform.",
    images: ["/logo@2x.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
