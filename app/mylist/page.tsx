import type { Metadata } from "next";

import { MyListClient } from "./client";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Моё",
  description: "Личный список тайтлов: смотрю, в планах, просмотрено, брошено.",
};

export default function MyListPage() {
  return <MyListClient />;
}
