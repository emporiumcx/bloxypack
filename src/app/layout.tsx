import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import { Shell } from "@/components/shell";
import "./globals.css";

const geologica = localFont({
  src: "../fonts/Geologica.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-geologica",
  display: "swap",
  fallback: ["Geologica Fallback", "Arial", "Helvetica", "sans-serif"],
  adjustFontFallback: false,
});

const tacticSans = localFont({
  src: [
    { path: "../fonts/tacticSans.woff2", weight: "400", style: "normal" },
    { path: "../fonts/tacticSans-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/tacticSans-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-tactic-sans",
  display: "swap",
  fallback: ["tacticSans Fallback", "Arial", "Helvetica", "sans-serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "BloxyWild | Premium Case Opening Site",
  description: "Crack cases. Win limiteds. Cash out crypto.",
  icons: { icon: "/img/icon.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geologica.variable} ${tacticSans.variable} min-h-full antialiased`}>
      <body className={`${geologica.className} min-h-full`}>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
