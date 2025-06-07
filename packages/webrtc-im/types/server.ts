import type { Socket } from "socket.io";
import type { ClientHandler, ServerHandler } from "./signaling";
import type { DeviceType } from "./client";

export const ERROR_CODE = {
  OK: 0,
  BUSY: 400,
  NOT_FOUNT: 404,
} as const;

export type SocketMember = {
  /** Socket id */
  id: string;
  /** 客户端脱敏 ip */
  ip: string;
  /** 客户端 ip md5 */
  hash: string;
  /** 客户端设备 */
  device: DeviceType;
  /** webrtc 链接状态 */
  connected: boolean;
  /** ServerSocket */
  socket: ServerSocket;
};

export type ServerSocket = Socket<ClientHandler, ServerHandler>;
