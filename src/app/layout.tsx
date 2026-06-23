import type { Metadata } from "next";
import { Bebas_Neue, Inter, Courier_Prime } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const courier = Courier_Prime({
  variable: "--font-courier",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "828 Grill — Fire. Smoke. Craft.",
  description:
    "828 Grill LLC — premium grill-house burgers, sides, drinks and combos. Order online for pickup. Fire-crafted, smoke-finished.",
  keywords: [
    "828 Grill",
    "burgers",
    "grill",
    "smash burger",
    "BBQ",
    "online ordering",
    "food delivery",
  ],
  authors: [{ name: "828 Grill LLC" }],
  openGraph: {
    title: "828 Grill — Fire. Smoke. Craft.",
    description:
      "Premium grill-house burgers, sides, drinks and combos. Order online.",
    siteName: "828 Grill",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "828 Grill — Fire. Smoke. Craft.",
    description:
      "Premium grill-house burgers, sides, drinks and combos. Order online.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${bebas.variable} ${inter.variable} ${courier.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <Providers>{children}</Providers>
        <Toaster />
        <SonnerToaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              border: "1px solid rgba(245,240,232,0.12)",
              color: "#f5f0e8",
            },
          }}
        />
      </body>
    </html>
  );
}
