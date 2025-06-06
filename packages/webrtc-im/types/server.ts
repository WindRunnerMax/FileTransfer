import type { Socket } from "socket.io";
import type { ClientHandler, ServerHandler } from "./signaling";
import type { DeviceType } from "./client";
import type { O } from "@block-kit/utils/dist/es/types";

export const CONNECT_STATE = {
  READY: "READY",
  CONNECTED: "CONNECTED",
} as const;

export const ERROR_CODE = {
  BUSY: 400,
  NOT_FOUNT: 404,
} as const;

export type SocketMember = {
  /** Socket id */
  id: string;
  /** 客户端 ip */
  ip: string;
  /** 客户端设备 */
  device: DeviceType;
  /** webrtc 链接状态 */
  connected: boolean;
  /** ServerSocket */
  socket: ServerSocket;
};

export type ServerSocket = Socket<ClientHandler, ServerHandler>;
export type ConnectionState = O.Values<typeof CONNECT_STATE>;
