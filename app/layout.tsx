import type { Metadata } from "next";
import { Space_Grotesk, Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomTabs } from "@/components/layout/bottom-tabs";

// UI-латиница и цифры (логотип KAGE, метаданные)
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

// Кириллический фолбэк для UI (Space Grotesk без кириллицы)
const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

// Фирменные заголовки KAGE — дисплейный серив с италиком и кириллицей
const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
});

import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — смотреть аниме онлайн`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — смотреть аниме онлайн`,
    description: SITE_DESCRIPTION,
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — смотреть аниме онлайн`,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`dark ${grotesk.variable} ${manrope.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-full flex-col bg-background pb-[72px] font-sans text-foreground md:pb-0">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <BottomTabs />
      </body>
    </html>
  );
}
