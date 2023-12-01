import { Socket } from "socket.io";
import { ClientHandler, ServerHandler } from "./signaling";
import { DEVICE_TYPE } from "./client";

export type ServerSocket = Socket<ClientHandler, ServerHandler>;
export enum CONNECTION_STATE {
  "NORMAL",
  "LINKED",
}
export type Member = { socket: ServerSocket; device: DEVICE_TYPE; state: CONNECTION_STATE };
