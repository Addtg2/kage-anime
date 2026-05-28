"use client";

import { useEffect, useState } from "react";

/**
 * Возвращает true после первого клиентского рендера. Используется, чтобы не
 * читать persist-стор в SSR/первом рендере и избежать гидрейшен-варнинга.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
