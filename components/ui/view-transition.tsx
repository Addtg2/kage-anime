"use client";

import * as React from "react";

// React 19.2 экспортирует ViewTransition как unstable_ViewTransition.
// Тонкая обёртка скрывает unstable-имя и даёт SSR-fallback на случай,
// если API ещё не доступен в окружении.
const ReactExports = React as unknown as {
  unstable_ViewTransition?: React.ComponentType<{
    name?: string;
    children?: React.ReactNode;
  }>;
};

const NativeViewTransition = ReactExports.unstable_ViewTransition;

export function ViewTransition({
  name,
  children,
}: {
  name?: string;
  children: React.ReactNode;
}) {
  if (NativeViewTransition) {
    return <NativeViewTransition name={name}>{children}</NativeViewTransition>;
  }
  // Фолбэк: просто рендерим детей, если API недоступен.
  return <>{children}</>;
}
