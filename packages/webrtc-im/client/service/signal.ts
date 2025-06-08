import type { Socket } from "socket.io-client";
import io from "socket.io-client";
import type {
  CallbackEvent,
  ClientEvent,
  ClientEventKeys,
  ClientHandler,
  ServerEventKeys,
  ServerFunc,
  ServerHandler,
} from "../../types/signaling";
import type { PrimitiveAtom } from "jotai";
import { atom } from "jotai";
import { CLINT_EVENT } from "../../types/signaling";
import { Bind, IS_MOBILE } from "@block-kit/utils";
import type { ConnectionState } from "../../types/client";
import { CONNECTION_STATE, DEVICE_TYPE } from "../../types/client";
import type { PromiseWithResolve } from "../utils/connection";
import { createConnectReadyPromise } from "../utils/connection";
import { atoms } from "../store/atoms";

export class SignalService {
  /** 连接状态 */
  public readonly stateAtom: PrimitiveAtom<ConnectionState>;
  /** 客户端 id */
  public id: string;
  /** Socket 实例 */
  public readonly socket: Socket<ServerHandler, ClientHandler>;
  /** 连接成功 Promise */
  private connectedPromise: PromiseWithResolve<void> | null;

  constructor(wss: string) {
    this.id = "";
    this.connectedPromise = createConnectReadyPromise();
    const socket = io(wss, { transports: ["websocket"] });
    this.socket = socket;
    this.socket.on("connect", this.onConnected);
    this.socket.on("disconnect", this.onDisconnect);
    this.stateAtom = atom<ConnectionState>(CONNECTION_STATE.CONNECTING);
  }

  public destroy() {
    this.socket.close();
    this.connectedPromise = null;
    this.socket.off("connect", this.onConnected);
    this.socket.off("disconnect", this.onDisconnect);
  }

  /**
   * 等待连接
   */
  public connected() {
    if (!this.connectedPromise) return Promise.resolve();
    return this.connectedPromise;
  }

  public on<T extends ServerEventKeys>(key: T, cb: ServerFunc<T>) {
    // @ts-expect-error unknown
    this.socket.on(key, cb);
  }

  public off<T extends ServerEventKeys>(key: T, cb: ServerFunc<T>) {
    // @ts-expect-error unknown
    this.socket.off(key, cb);
  }

  public emit<T extends ClientEventKeys>(
    key: T,
    payload: ClientEvent[T],
    callback?: (state: CallbackEvent) => void
  ) {
    // @ts-expect-error unknown
    this.socket.emit(key, payload, callback);
  }

  @Bind
  private onConnected() {
    this.connectedPromise && this.connectedPromise.resolve();
    this.connectedPromise = null;
    atoms.set(this.stateAtom, CONNECTION_STATE.CONNECTED);
    const payload = {
      device: IS_MOBILE ? DEVICE_TYPE.MOBILE : DEVICE_TYPE.PC,
    };
    this.emit(CLINT_EVENT.JOIN_ROOM, payload, (state: CallbackEvent) => {
      this.id = state.message;
    });
  }

  @Bind
  private onDisconnect() {
    atoms.set(this.stateAtom, CONNECTION_STATE.CONNECTING);
    this.connectedPromise = createConnectReadyPromise();
  }
}
