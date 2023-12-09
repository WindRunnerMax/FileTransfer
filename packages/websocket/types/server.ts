import { Socket } from "socket.io";
import { ClientHandler, ServerHandler } from "./websocket";
import { DEVICE_TYPE } from "./client";

export type ServerSocket = Socket<ClientHandler, ServerHandler>;
export enum CONNECTION_STATE {
  "READY",
  "CONNECTING",
  "CONNECTED",
}
export enum SHAKE_HANDS {
  "ACCEPT",
  "REJECT",
}
export enum ERROR_TYPE {
  "NO_ERROR",
  "PEER_BUSY",
  "PEER_NOT_FOUND",
}
export type Member = {
  socket: ServerSocket;
  device: DEVICE_TYPE;
  state: CONNECTION_STATE;
};
