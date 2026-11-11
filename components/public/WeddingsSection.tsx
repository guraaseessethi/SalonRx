import { getRepository } from "@/lib/data";
import { Weddings } from "./Weddings";

export async function WeddingsSection({ as }: { as?: "h1" | "h2" }) {
  const services = await getRepository().listServices();
  return <Weddings initialServices={services} as={as} />;
}
