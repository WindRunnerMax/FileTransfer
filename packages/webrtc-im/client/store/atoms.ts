import type { F } from "@block-kit/utils/dist/es/types";
import type { Atom, WritableAtom } from "jotai";
import { createStore } from "jotai";

export class AtomsFactory {
  public store: F.Return<typeof createStore>;
  constructor() {
    this.store = createStore();
  }

  public get<T>(atom: Atom<T>): T {
    return this.store.get(atom);
  }

  public set<Value, Args extends unknown[], Result>(
    atom: WritableAtom<Value, Args, Result>,
    ...args: Args
  ): Result {
    return this.store.set(atom, ...args);
  }
}

export const atoms = new AtomsFactory();
