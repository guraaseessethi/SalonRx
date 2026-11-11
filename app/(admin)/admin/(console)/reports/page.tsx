import type { Metadata } from "next";
import { Reports } from "@/components/admin/modules/Reports";

export const metadata: Metadata = { title: "Reports" };

export default function Page() {
  return <Reports />;
}
