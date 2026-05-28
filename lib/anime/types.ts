// Единая модель тайтла для KAGE. Сейчас наполняется sample-данными (прототип),
// позже сюда же маппится ответ Shikimori GraphQL — UI не меняется.

export interface Anime {
  id: string;
  /** Оригинальное (романизированное) название */
  title: string;
  /** Русское название */
  titleRu: string;
  /** Японское название (кандзи/кана) */
  titleJp: string;
  year: number;
  /** Кол-во эпизодов */
  eps: number;
  /** Рейтинг 0–10 */
  rating: number;
  /** Возрастной рейтинг, напр. "16+" */
  age: string;
  genres: string[];
  studio: string;
  /** Короткий слоган для hero/постера */
  tagline: string;
  synopsis: string;
  /** Триада цветов для стилизованного постера-плейсхолдера: [base, mid, key] */
  palette: [string, string, string];
  /** URL реального постера (Shikimori). Если нет — рисуем SVG-плейсхолдер */
  posterUrl?: string;
}

export interface Rail {
  id: string;
  title: string;
  subtitle?: string;
  ids: string[];
  /** Прогресс просмотра 0–1 для рельса "Продолжить просмотр" */
  progress?: number[];
}

export interface Episode {
  num: number;
  title: string;
  duration: number;
  thumb: [string, string, string];
}
