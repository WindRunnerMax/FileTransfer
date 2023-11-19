import io, { Socket } from "socket.io-client";
import { SOCKET_EVENT_ENUM, SocketHandler } from "../types/signaling-event";

export class SignalingServer {
  public readonly socket: Socket<SocketHandler, SocketHandler>;
  constructor(private id: string) {
    const socket = io("http://localhost:3000", { transports: ["websocket"] });
    this.socket = socket;
    this.socket.on("connect", this.onConnect);
    this.socket.on("disconnect", this.onDisconnect);
  }

  private onConnect = () => {
    this.socket.emit(SOCKET_EVENT_ENUM.JOIN_ROOM, { id: this.id });
  };

  private onDisconnect = () => {
    this.socket.emit(SOCKET_EVENT_ENUM.LEAVE_ROOM, { id: this.id });
  };

  destroy = () => {
    this.socket.emit(SOCKET_EVENT_ENUM.LEAVE_ROOM, { id: this.id });
    this.socket.close();
  };
}
