// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EventBusType {}

export type EventContext = {
  /** 事件名 */
  key: string | number | symbol;
  /** 已停止顺序执行 */
  stopped: boolean;
  /** 已阻止默认行为 */
  prevented: boolean;
  /** 停止顺序执行 */
  stop: () => void;
  /** 阻止默认行为 */
  prevent: () => void;
};

export type Handler<E, T extends EventKeys<E>> = {
  once: boolean;
  priority: number;
  listener: Listener<E, T>;
};

export type EventKeys<E> = keyof E;
export type Listeners<E> = { [T in EventKeys<E>]?: Handler<E, T>[] };
export type Listener<E, T extends EventKeys<E>> = (payload: E[T], context: EventContext) => unknown;

export class EventBus<E = EventBusType> {
  /**
   * 事件监听器
   */
  private listeners: Listeners<E> = {};

  /**
   * 监听事件
   * @param key
   * @param listener
   * @param priority 默认为 100
   */
  public on<T extends EventKeys<E>>(key: T, listener: Listener<E, T>, priority = 100) {
    this.addEventListener(key, listener, priority, false);
  }

  /**
   * 一次性事件监听
   * @param key
   * @param listener
   * @param priority 默认为 100
   */
  public once<T extends EventKeys<E>>(key: T, listener: Listener<E, T>, priority = 100) {
    this.addEventListener(key, listener, priority, true);
  }

  /**
   * 添加事件监听
   * @param key
   * @param listener
   * @param priority
   * @param once
   */
  private addEventListener<T extends EventKeys<E>>(
    key: T,
    listener: Listener<E, T>,
    priority: number,
    once: boolean
  ) {
    const handler: Handler<E, T>[] = this.listeners[key] || [];
    if (!handler.some(item => item.listener === listener)) {
      handler.push({ listener, priority, once });
    }
    handler.sort((a, b) => a.priority - b.priority);
    this.listeners[key] = <Handler<E, T>[]>handler;
  }

  /**
   * 移除事件监听
   * @param key
   * @param listener
   */
  public off<T extends EventKeys<E>>(key: T, listener: Listener<E, T>) {
    const handler = this.listeners[key];
    if (!handler) return void 0;
    // COMPAT: 不能直接`splice` 可能会导致`trigger`时打断`forEach`
    const next = handler.filter(item => item.listener !== listener);
    this.listeners[key] = <Handler<E, T>[]>next;
  }

  /**
   * 触发事件
   * @param key
   * @param listener
   * @returns prevented
   */
  public emit<T extends EventKeys<E>>(key: T, payload: E[T]): boolean {
    const handler = this.listeners[key];
    if (!handler) return false;
    const context: EventContext = {
      key: key,
      stopped: false,
      prevented: false,
      stop: () => {
        context.stopped = true;
      },
      prevent: () => {
        context.prevented = true;
      },
    };
    for (const item of handler) {
      item.listener(payload, context);
      item.once && this.off(key, item.listener);
      if (context.stopped) break;
    }
    return context.prevented;
  }

  /**
   * 清理事件
   */
  public clear() {
    this.listeners = {};
  }
}
