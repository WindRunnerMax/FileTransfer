import type { O } from "@block-kit/utils/dist/es/types";
import { CONNECTION_STATE } from "../../types/client";
import { getId, Storage } from "@block-kit/utils";
import { SESSION_KEY } from "../../types/server";

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

const IS_COPIED_TAB = "x-is-copied-tab";

export const getSessionId = () => {
  try {
    if (Storage.session.get<boolean>(IS_COPIED_TAB)) {
      return getId();
    }
    const [navigationEntry] = performance.getEntriesByType(
      "navigation"
    ) as PerformanceNavigationTiming[];
    const isReload = navigationEntry && navigationEntry.type === "reload";
    const isOpenedBefore = !!Storage.session.get<string>(SESSION_KEY);
    if (!isReload && isOpenedBefore) {
      // 如果不是刷新页面，并且之前已经打开过，则很可能是从另一个标签页复制而来的
      // Tab 复制行为是完全拷贝而非共享, 因此在这里直接设置值是安全的, 不会共享到源
      Storage.session.set(IS_COPIED_TAB, true);
      return getId();
    }
    const sessionId = Storage.session.get<string>(SESSION_KEY) || getId();
    Storage.session.set(SESSION_KEY, sessionId);
    return sessionId;
  } catch (error) {
    console.error("GetSessionId Error:", error);
    return getId();
  }
};
