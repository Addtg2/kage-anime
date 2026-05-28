// Шрифтовые стеки для использования внутри inline-стилей и SVG-атрибутов,
// где классы Tailwind неприменимы. CSS-переменные определены в layout.tsx/globals.css.
// Прим.: var() работает в inline style, но НЕ в SVG-атрибуте font-family —
// поэтому для SVG-текста (jp) используем литеральные имена шрифтов.
export const KAGE_FONTS = {
  ui: "var(--font-grotesk), var(--font-manrope), system-ui, sans-serif",
  jp: "'Noto Sans JP', system-ui, sans-serif",
} as const;
