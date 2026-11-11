import { redirect } from "next/navigation";

// Handled by the layout below: /admin shows the demo role gate, then the console.
export default function AdminIndex() {
  redirect("/admin/dashboard");
}
