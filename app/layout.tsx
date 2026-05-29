import type { Metadata } from "next";
import { Space_Grotesk, Manrope, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomTabs } from "@/components/layout/bottom-tabs";
import { KbdNav } from "@/components/kage/kbd-nav";
import { NotificationScheduler } from "@/components/kage/notification-scheduler";
import { ThemeProvider } from "@/components/kage/theme-provider";
import { TapTest } from "@/components/kage/tap-test";
import { Toaster } from "sonner";

// UI-латиница и цифры (логотип KAGE, метаданные)
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
  preload: true,
});

// Кириллический фолбэк для UI (Space Grotesk без кириллицы)
const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
  preload: true,
});

// Фирменные заголовки KAGE — дисплейный серив с италиком и кириллицей
const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
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
        {/*
          Часть 0 диагностики: убиваем любой ранее зарегистрированный SW ДО хидрации React.
          Если оставить unregister на useEffect, стейл-prod-SW успевает отдать старый HTML/JS
          → hidration mismatch → ВЕСЬ JS на странице мёртв (особенно заметно на iOS Safari,
          где SW переживает закрытие вкладки).
        */}
        <Script id="kage-sw-kill" strategy="beforeInteractive">
          {`(function(){try{if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})}).catch(function(){});if(self.caches){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})}).catch(function(){})}}}catch(e){}})();`}
        </Script>
        {process.env.NODE_ENV !== "production" && (
          <Script id="kage-eruda-gated" strategy="beforeInteractive">
            {`try{if(location.search.indexOf('debug=1')>-1){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/eruda';s.onload=function(){try{eruda.init()}catch(e){}};document.head.appendChild(s)}}catch(e){}`}
          </Script>
        )}
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0a0a0f" />
        {process.env.NODE_ENV !== "production" && (
          <>
            <meta httpEquiv="Cache-Control" content="no-store, no-cache, must-revalidate" />
            <meta httpEquiv="Pragma" content="no-cache" />
            <meta httpEquiv="Expires" content="0" />
          </>
        )}
      </head>
      <body className="flex min-h-full flex-col bg-background pb-[72px] font-sans text-foreground md:pb-0">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <BottomTabs />
        <KbdNav />
        <ThemeProvider />
        <NotificationScheduler />
        <TapTest />
        <Toaster
          position="top-center"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            },
          }}
        />
      </body>
    </html>
  );
}
