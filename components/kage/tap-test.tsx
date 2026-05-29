"use client";

import { useEffect, useState } from "react";

/**
 * Диагностический тестер кликов. Если кнопка реагирует — React хидрация живая,
 * проблема в конкретных компонентах. Если не реагирует — общая поломка JS.
 * Скрыт по умолчанию; виден при URL `?taptest=1`.
 */
export function TapTest() {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.location.search.includes("taptest=1")) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        right: 12,
        zIndex: 9999,
      }}
    >
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        style={{
          background: "#ff2e63",
          color: "white",
          padding: "12px 16px",
          borderRadius: 999,
          fontWeight: 700,
          fontSize: 14,
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          border: "none",
          touchAction: "manipulation",
        }}
      >
        TAP TEST: {count}
      </button>
    </div>
  );
}
