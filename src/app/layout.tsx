import type { Metadata } from "next";
import { Onest } from "next/font/google";
import { Providers } from "@/components/providers";
import { Shell } from "@/components/shell";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "RoStake | Premium Case Opening Site",
  description: "Crack cases. Win limiteds. Cash out crypto.",
  icons: { icon: "/img/icon.webp" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${onest.variable} min-h-full antialiased`}>
      <body className={`${onest.className} min-h-full`}>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
