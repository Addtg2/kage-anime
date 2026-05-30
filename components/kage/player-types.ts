// Типы плеера KAGE. Вынесены отдельно, чтобы их могли импортировать и
// серверные (детальная страница), и клиентские (встроенный плеер) модули
// без тяги за собой компонентов.

export interface PlayerTranslation {
  id: number;
  title: string;
  /** "voice" | "subtitles" | ... */
  type: string;
  /** Готовый https-URL для iframe */
  src: string;
}

export interface PlayerTab {
  id: "kodik" | "alloha";
  label: string;
  available: boolean;
  src?: string;
  translations?: PlayerTranslation[];
}
