import type { Metadata } from "next";
import { Marketing } from "@/components/admin/modules/Marketing";

export const metadata: Metadata = { title: "Marketing" };

export default function Page() {
  return <Marketing />;
}
