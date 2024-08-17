import type { Socket } from "socket.io";
import type { ClientHandler, ServerHandler } from "./websocket";
import type { ConnectionState, DeviceType } from "./client";
import type { Object } from "laser-utils";
export type { ConnectionState } from "./client";
export { CONNECTION_STATE } from "./client";

export const SHAKE_HANDS = {
  ACCEPT: "ACCEPT",
  REJECT: "REJECT",
} as const;

export const ERROR_TYPE = {
  NO_ERROR: "NO_ERROR",
  PEER_BUSY: "PEER_BUSY",
  PEER_NOT_FOUND: "PEER_NOT_FOUND",
} as const;

export type Member = {
  socket: ServerSocket;
  device: DeviceType;
  state: ConnectionState;
};

export type ErrorType = Object.Values<typeof ERROR_TYPE>;
export type ShakeHands = Object.Values<typeof SHAKE_HANDS>;
export type ServerSocket = Socket<ClientHandler, ServerHandler>;
