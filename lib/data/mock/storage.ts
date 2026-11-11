/** Tiny storage abstraction so the mock repository runs in the browser (localStorage) and on the server (memory). */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class MemoryStorage implements StorageAdapter {
  private map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

/** Wraps a Web Storage object. Every call is guarded: private windows and blocked storage must not break the site. */
export class WebStorageAdapter implements StorageAdapter {
  constructor(private readonly resolve: () => Storage) {}
  getItem(key: string) {
    try {
      return this.resolve().getItem(key);
    } catch {
      return null;
    }
  }
  setItem(key: string, value: string) {
    try {
      this.resolve().setItem(key, value);
    } catch {
      /* storage full or blocked: the demo keeps working in memory */
    }
  }
  removeItem(key: string) {
    try {
      this.resolve().removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
