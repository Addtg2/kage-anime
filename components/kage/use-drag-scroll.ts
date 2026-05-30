"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

/**
 * Drag-to-scroll вбок для горизонтальных лент: зажал и тянешь.
 * Move/up слушаем на window, чтобы перетаскивание не рвалось при выходе курсора.
 * `onDragStart` гасит нативное перетаскивание картинок/ссылок внутри ленты.
 * `didDrag()` — был ли это drag (чтобы подавить клик/переход по карточке).
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  useEffect(() => {
    const onMove = (e: globalThis.PointerEvent) => {
      const el = ref.current;
      if (!el || !drag.current.active) return;
      const dx = e.clientX - drag.current.startX;
      if (Math.abs(dx) > 4) drag.current.moved = true;
      el.scrollLeft = drag.current.startScroll - dx;
    };
    const onUp = () => {
      drag.current.active = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const onPointerDown = (e: ReactPointerEvent<T>) => {
    const el = ref.current;
    // Только мышь/перо: на тач-устройствах оставляем нативную прокрутку
    // (иначе ручной drag ломает вертикальный скролл страницы).
    if (!el || e.button !== 0 || e.pointerType === "touch") return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
  };

  const onDragStart = (e: { preventDefault: () => void }) => e.preventDefault();

  const didDrag = () => drag.current.moved;

  return { ref, onPointerDown, onDragStart, didDrag };
}
