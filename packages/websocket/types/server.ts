import { Socket } from "socket.io";
import { ClientHandler, ServerHandler } from "./websocket";
import { DEVICE_TYPE } from "./client";

export type ServerSocket = Socket<ClientHandler, ServerHandler>;
export enum CONNECTION_STATE {
  "NORMAL",
  "LINKED",
}
export enum SHAKE_HANDS {
  "ACCEPT",
  "REJECT",
}
export type Member = {
  socket: ServerSocket;
  device: DEVICE_TYPE;
};
