"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getRepository } from "@/lib/data";
import type { DataRepository } from "@/lib/data/repository";

interface RepositoryContextValue {
  repo: DataRepository;
  /** Bumps after every write so queries refetch. */
  revision: number;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

export function RepositoryProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => getRepository(), []);
  const [revision, setRevision] = useState(0);

  useEffect(() => repo.subscribe(() => setRevision((r) => r + 1)), [repo]);

  const value = useMemo(() => ({ repo, revision }), [repo, revision]);
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}

function useRepositoryContext(): RepositoryContextValue {
  const ctx = useContext(RepositoryContext);
  if (!ctx) throw new Error("useRepository must be used inside <RepositoryProvider>");
  return ctx;
}

/** The repository, for calling writes: `const repo = useRepository(); await repo.createSale(...)`. */
export function useRepository(): DataRepository {
  return useRepositoryContext().repo;
}

export interface QueryResult<T> {
  data: T;
  /** False until the browser has read the repository at least once. */
  ready: boolean;
}

/**
 * Read data through the repository and keep it fresh.
 * `initial` is what the server rendered (seed content), so the first client render matches the HTML.
 * Pass a stable function (see lib/data/queries.ts).
 */
export function useRepoQuery<T>(query: (repo: DataRepository) => Promise<T>, initial: T): QueryResult<T>;
export function useRepoQuery<T>(query: (repo: DataRepository) => Promise<T>): QueryResult<T | undefined>;
export function useRepoQuery<T>(
  query: (repo: DataRepository) => Promise<T>,
  initial?: T,
): QueryResult<T | undefined> {
  const { repo, revision } = useRepositoryContext();
  const [state, setState] = useState<QueryResult<T | undefined>>({ data: initial, ready: false });

  useEffect(() => {
    let cancelled = false;
    query(repo).then((data) => {
      if (!cancelled) setState({ data, ready: true });
    });
    return () => {
      cancelled = true;
    };
  }, [repo, revision, query]);

  return state;
}
