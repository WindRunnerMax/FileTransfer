import io, { Socket } from "socket.io-client";
import { SOCKET_EVENT_ENUM, SocketHandler } from "../types/signaling";

export class SignalingServer {
  public readonly socket: Socket<SocketHandler, SocketHandler>;
  constructor(wss: string) {
    const socket = io(wss, { transports: ["websocket"] });
    this.socket = socket;
    this.socket.on("connect", this.onConnect);
    this.socket.on("disconnect", this.onDisconnect);
  }

  private onConnect = () => {
    this.socket.emit(SOCKET_EVENT_ENUM.JOIN_ROOM, { id: this.socket.id });
  };

  private onDisconnect = () => {
    this.socket.emit(SOCKET_EVENT_ENUM.LEAVE_ROOM, { id: this.socket.id });
  };

  public destroy = () => {
    this.socket.emit(SOCKET_EVENT_ENUM.LEAVE_ROOM, { id: this.socket.id });
    this.socket.off("connect", this.onConnect);
    this.socket.off("disconnect", this.onDisconnect);
    this.socket.close();
  };
}
