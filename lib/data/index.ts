import type { DataRepository } from "./repository";
import { MockRepository } from "./mock/mock-repository";
import { MemoryStorage, WebStorageAdapter } from "./mock/storage";

export type { DataRepository } from "./repository";

export type DataSource = "mock" | "supabase";

function dataSource(): DataSource {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? "supabase" : "mock";
}

let instance: DataRepository | null = null;

/**
 * The one place that decides which data layer runs.
 *  - mock (Phase 1): seed data. In the browser it persists to localStorage; on the server it is in-memory
 *    and read-only in practice (the public pages render seed content, the browser then takes over).
 *  - supabase (Phase 2): not built yet. See docs/MIGRATION.md.
 */
export function getRepository(): DataRepository {
  if (instance) return instance;
  if (dataSource() === "supabase") {
    throw new Error(
      "NEXT_PUBLIC_DATA_SOURCE=supabase is a Phase 2 feature. Set NEXT_PUBLIC_DATA_SOURCE=mock. See docs/MIGRATION.md.",
    );
  }
  const inBrowser = typeof window !== "undefined";
  instance = new MockRepository(
    inBrowser
      ? {
          data: new WebStorageAdapter(() => window.localStorage),
          session: new WebStorageAdapter(() => window.sessionStorage),
          watchOtherTabs: true,
        }
      : { data: new MemoryStorage(), session: new MemoryStorage() },
  );
  return instance;
}
