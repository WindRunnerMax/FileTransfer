import type { O } from "@block-kit/utils/dist/es/types";
import { CONNECTION_STATE } from "../../types/client";

export type PromiseWithResolve<T> = Promise<T> & { resolve: (v: T) => void };

export const createConnectReadyPromise = () => {
  // Promise 可以被多次 await, 类似下面的例子输出是 1 2 3
  // const { promise, resolve } = Promise.withResolvers();
  // [1, 2, 3].forEach(async i => {
  //   await promise;
  //   console.log("Hello", i);
  // });
  // resolve();
  let resolve: () => void;
  const promise = new Promise(res => {
    resolve = res;
  }) as PromiseWithResolve<void>;
  promise.resolve = resolve!;
  return promise;
};

export const CONNECT_DOT: O.Map<string> = {
  [CONNECTION_STATE.READY]: "rgb(var(--red-6))",
  [CONNECTION_STATE.CONNECTING]: "rgb(var(--orange-6))",
  [CONNECTION_STATE.CONNECTED]: "rgb(var(--green-6))",
};
