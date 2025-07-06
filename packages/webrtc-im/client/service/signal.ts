import type { Socket } from "socket.io-client";
import io from "socket.io-client";
import type {
  CallbackEvent,
  ClientEvent,
  ClientEventKeys,
  ClientHandler,
  ServerEvent,
  ServerEventKeys,
  ServerHandler,
} from "../../types/signaling";
import type { PrimitiveAtom } from "jotai";
import { atom } from "jotai";
import { CLINT_EVENT, SERVER_EVENT } from "../../types/signaling";
import { Bind, IS_MOBILE } from "@block-kit/utils";
import type { ConnectionState } from "../../types/client";
import { CONNECTION_STATE, DEVICE_TYPE } from "../../types/client";
import type { PromiseWithResolve } from "../utils/connection";
import { createConnectReadyPromise, getSessionId } from "../utils/connection";
import { atoms } from "../store/atoms";
import { EventBus } from "../utils/event-bus";
import type { P } from "@block-kit/utils/dist/es/types";

export class SignalService {
  /** 连接状态 */
  public readonly stateAtom: PrimitiveAtom<ConnectionState>;
  /** 客户端 id */
  public id: string;
  /** 客户端 ip */
  public ip: string;
  /** 客户端 ip hash */
  public hash: string;
  /** 事件总线 */
  public bus: EventBus<ServerEvent>;
  /** Socket 实例 */
  public readonly socket: Socket<ServerHandler, ClientHandler>;
  /** 连接成功 Promise */
  private connectedPromise: PromiseWithResolve<void> | null;

  constructor(wss: string) {
    this.id = "";
    this.ip = "";
    this.hash = "";
    this.connectedPromise = createConnectReadyPromise();
    const sessionId = getSessionId();
    const socket = io(wss, {
      transports: ["websocket"],
      auth: { sessionId },
    });
    this.socket = socket;
    this.bus = new EventBus<ServerEvent>();
    this.socket.on("connect", this.onConnected);
    this.socket.on("disconnect", this.onDisconnect);
    this.socket.onAny(this.onAnyEvent);
    this.bus.on(SERVER_EVENT.INIT_USER, this.onInitUser);
    this.stateAtom = atom<ConnectionState>(CONNECTION_STATE.CONNECTING);
  }

  public destroy() {
    this.bus.clear();
    this.socket.close();
    this.connectedPromise = null;
    this.socket.offAny(this.onAnyEvent);
    this.socket.off("connect", this.onConnected);
    this.socket.off("disconnect", this.onDisconnect);
    this.socket.off(SERVER_EVENT.INIT_USER, this.onInitUser);
  }

  /**
   * 等待连接
   */
  public isConnected() {
    if (!this.connectedPromise) return Promise.resolve();
    return this.connectedPromise;
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
    const payload = {
      device: IS_MOBILE ? DEVICE_TYPE.MOBILE : DEVICE_TYPE.PC,
    };
    this.emit(CLINT_EVENT.JOIN_ROOM, payload);
  }

  @Bind
  private onInitUser(payload: ServerEvent["INIT_USER"]) {
    const { id, ip, hash } = payload.self;
    this.id = id;
    this.ip = ip;
    this.hash = hash;
    console.log("Init User", payload);
    this.connectedPromise && this.connectedPromise.resolve();
    this.connectedPromise = null;
    atoms.set(this.stateAtom, CONNECTION_STATE.CONNECTED);
  }

  @Bind
  private onAnyEvent(event: string, payload: P.Any) {
    this.bus.emit(event as ServerEventKeys, payload);
  }

  @Bind
  private onDisconnect() {
    atoms.set(this.stateAtom, CONNECTION_STATE.CONNECTING);
    this.connectedPromise = createConnectReadyPromise();
  }
}
