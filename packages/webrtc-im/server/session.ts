import { getId } from "@block-kit/utils";

export class LRUSession {
  private MAX_SIZE: number;
  private SESSIONS: Map<string, string>;

  constructor() {
    this.MAX_SIZE = 100;
    this.SESSIONS = new Map<string, string>();
  }

  public getId(key: string) {
    const id = this.SESSIONS.get(key) || getId();
    this.SESSIONS.delete(key);
    this.SESSIONS.set(key, id);
    this.inspectLRUSession();
    return id;
  }

  private inspectLRUSession() {
    const size = this.SESSIONS.size;
    if (size <= this.MAX_SIZE) {
      return void 0;
    }
    const n = size - this.MAX_SIZE;
    const iterator = this.SESSIONS.keys();
    for (let i = 0; i < n; i++) {
      const key = iterator.next().value;
      key && this.SESSIONS.delete(key);
    }
  }
}
