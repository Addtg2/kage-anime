import type { Metadata } from "next";

import { ProfileClient } from "./client";

export const metadata: Metadata = {
  title: "Профиль",
  description: "Настройки KAGE: плеер по умолчанию, экспорт/импорт, очистка.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
