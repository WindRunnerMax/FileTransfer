import io, { Socket } from "socket.io-client";
import { SOCKET_EVENT_ENUM, SocketHandler } from "../types/signaling";

export class SignalingServer {
  public readonly socket: Socket<SocketHandler, SocketHandler>;
  constructor(wss: string, private id: string) {
    const socket = io(wss, { transports: ["websocket"] });
    this.socket = socket;
    this.socket.on("connect", this.onConnect);
    this.socket.on("disconnect", this.onDisconnect);
  }

  private onConnect = () => {
    // https://socket.io/docs/v4/server-socket-instance/#socketid
    this.socket.emit(SOCKET_EVENT_ENUM.JOIN_ROOM, { id: this.id });
  };

  private onDisconnect = () => {
    this.socket.emit(SOCKET_EVENT_ENUM.LEAVE_ROOM, { id: this.id });
  };

  public destroy = () => {
    this.socket.emit(SOCKET_EVENT_ENUM.LEAVE_ROOM, { id: this.id });
    this.socket.off("connect", this.onConnect);
    this.socket.off("disconnect", this.onDisconnect);
    this.socket.close();
  };
}

// Reference
// https://socket.io/zh-CN/docs/v4/client-socket-instance/
