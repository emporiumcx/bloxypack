import type { Metadata } from "next";
import localFont from "next/font/local";
import { Skranji } from "next/font/google";
import { Providers } from "@/components/providers";
import { Shell } from "@/components/shell";
import "./globals.css";

const goldenSmile = localFont({
  src: [
    { path: "../fonts/GoldenSmile.otf", weight: "400", style: "normal" },
    { path: "../fonts/GoldenSmile.ttf", weight: "400", style: "normal" },
  ],
  variable: "--font-golden-smile",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
  adjustFontFallback: false,
});

const skranji = Skranji({
  variable: "--font-skranji",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BloxyWild | Premium Case Opening Site",
  description: "Crack cases. Win limiteds. Cash out crypto.",
  icons: { icon: "/img/icon.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${goldenSmile.variable} ${skranji.variable} min-h-full antialiased`}>
      <body className={`${goldenSmile.className} min-h-full`}>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
