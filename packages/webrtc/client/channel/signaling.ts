import io, { Socket } from "socket.io-client";
import {
  CLINT_EVENT,
  CallBackState,
  ClientEventKeys,
  ClientHandler,
  ServerEventKeys,
  ServerFn,
  ServerHandler,
  SocketEventParams,
} from "../../types/signaling";
import { isMobile } from "../utils/is";
import { DEVICE_TYPE } from "../../types/client";

export class SignalingServer {
  public readonly socket: Socket<ServerHandler, ClientHandler>;
  constructor(wss: string, private id: string) {
    const socket = io(wss, { transports: ["websocket"] });
    this.socket = socket;
    this.socket.on("connect", this.onConnect);
    this.socket.on("disconnect", this.onDisconnect);
  }

  public on = <T extends ServerEventKeys>(key: T, cb: ServerFn<T>) => {
    // @ts-expect-error unknown
    this.socket.on(key, cb);
  };

  public off = <T extends ServerEventKeys>(key: T, cb: ServerFn<T>) => {
    // @ts-expect-error unknown
    this.socket.off(key, cb);
  };

  public emit = <T extends ClientEventKeys>(
    key: T,
    payload: SocketEventParams[T],
    callback?: (state: CallBackState) => void
  ) => {
    // @ts-expect-error unknown
    this.socket.emit(key, payload, callback);
  };

  private onConnect = () => {
    // https://socket.io/docs/v4/server-socket-instance/#socketid
    this.emit(CLINT_EVENT.JOIN_ROOM, {
      id: this.id,
      device: isMobile() ? DEVICE_TYPE.MOBILE : DEVICE_TYPE.PC,
    });
  };

  private onDisconnect = () => {
    this.emit(CLINT_EVENT.LEAVE_ROOM, { id: this.id });
  };

  public destroy = () => {
    this.socket.emit(CLINT_EVENT.LEAVE_ROOM, { id: this.id });
    this.socket.off("connect", this.onConnect);
    this.socket.off("disconnect", this.onDisconnect);
    this.socket.close();
  };
}
