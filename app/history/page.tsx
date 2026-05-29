import type { Metadata } from "next";
import { HistoryClient } from "./client";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "История просмотров",
  description: "Локальная история просмотренных тайтлов и эпизодов",
};

export default function HistoryPage() {
  return <HistoryClient />;
}
