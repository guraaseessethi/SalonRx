import type { Metadata } from "next";
import { DemoRibbon } from "@/components/public/DemoRibbon";

export const metadata: Metadata = {
  title: { default: "Back office", template: "%s · Salon Rx back office" },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DemoRibbon />
    </>
  );
}
