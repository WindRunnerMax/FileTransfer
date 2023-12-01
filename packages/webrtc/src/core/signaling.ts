import io, { Socket } from "socket.io-client";
import { CLINT_EVENT, ClientHandler, ServerHandler } from "../types/signaling";

export class SignalingServer {
  public readonly socket: Socket<ServerHandler, ClientHandler>;
  constructor(wss: string, private id: string) {
    const socket = io(wss, { transports: ["websocket"] });
    this.socket = socket;
    this.socket.on("connect", this.onConnect);
    this.socket.on("disconnect", this.onDisconnect);
  }

  private onConnect = () => {
    // https://socket.io/docs/v4/server-socket-instance/#socketid
    this.socket.emit(CLINT_EVENT.JOIN_ROOM, { id: this.id });
  };

  private onDisconnect = () => {
    this.socket.emit(CLINT_EVENT.LEAVE_ROOM, { id: this.id });
  };

  public destroy = () => {
    this.socket.emit(CLINT_EVENT.LEAVE_ROOM, { id: this.id });
    this.socket.off("connect", this.onConnect);
    this.socket.off("disconnect", this.onDisconnect);
    this.socket.close();
  };
}

// Reference
// https://socket.io/zh-CN/docs/v4/client-socket-instance/
