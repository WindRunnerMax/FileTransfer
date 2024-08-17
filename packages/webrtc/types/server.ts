import type { Socket } from "socket.io";
import type { ClientHandler, ServerHandler } from "./signaling";
import type { DeviceType } from "./client";
import type { Object } from "laser-utils";

export const CONNECTION_STATE = {
  NORMAL: "NORMAL",
  LINKED: "LINKED",
} as const;

export const ERROR_TYPE = {
  PEER_BUSY: "PEER_BUSY",
  PEER_NOT_FOUND: "PEER_NOT_FOUND",
} as const;

export type ErrorType = Object.Values<typeof ERROR_TYPE>;
export type ServerSocket = Socket<ClientHandler, ServerHandler>;
export type ConnectionState = Object.Values<typeof CONNECTION_STATE>;
export type Member = { socket: ServerSocket; device: DeviceType; ip: string };
