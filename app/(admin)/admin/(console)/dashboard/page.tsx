import type { Metadata } from "next";
import { Dashboard } from "@/components/admin/modules/Dashboard";

export const metadata: Metadata = { title: "Today" };

export default function Page() {
  return <Dashboard />;
}
