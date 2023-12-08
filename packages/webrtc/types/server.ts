import { Socket } from "socket.io";
import { ClientHandler, ServerHandler } from "./signaling";
import { DEVICE_TYPE } from "./client";

export type ServerSocket = Socket<ClientHandler, ServerHandler>;
export enum CONNECTION_STATE {
  "NORMAL",
  "LINKED",
}
export enum ERROR_TYPE {
  "PEER_BUSY",
  "PEER_NOT_FOUND",
}
export type Member = {
  socket: ServerSocket;
  device: DEVICE_TYPE;
  ip: string;
};
