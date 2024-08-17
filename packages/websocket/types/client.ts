import type { Object } from "laser-utils";
import type { FileMeta, Spread } from "@ft/webrtc/types/client";
export { DEVICE_TYPE, TRANSFER_FROM, TRANSFER_TYPE } from "@ft/webrtc/types/client.ts";
export type { BufferType, Member, TransferType, DeviceType } from "@ft/webrtc/types/client.ts";

export const CHUNK_SIZE = 1024 * 256; // 256KB

export const CONNECTION_STATE = {
  READY: "READY",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
} as const;

export const MESSAGE_TYPE = {
  TEXT: "TEXT",
  FILE_START: "FILE_START",
  FILE_NEXT: "FILE_NEXT",
  FILE_CHUNK: "FILE_CHUNK",
  FILE_FINISH: "FILE_FINISH",
} as const;

export type MessageTypeMap = {
  [MESSAGE_TYPE.TEXT]: { data: string };
  [MESSAGE_TYPE.FILE_START]: { name: string } & FileMeta;
  [MESSAGE_TYPE.FILE_NEXT]: { current: number } & FileMeta;
  [MESSAGE_TYPE.FILE_CHUNK]: { current: number; chunk: string } & FileMeta;
  [MESSAGE_TYPE.FILE_FINISH]: { id: string };
};

export type MessageType = Spread<MessageTypeMap>;
export type ConnectionState = Object.Values<typeof CONNECTION_STATE>;
