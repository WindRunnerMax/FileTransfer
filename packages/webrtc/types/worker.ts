import type { Spread } from "./client";

export const HEADER_KEY = {
  FILE_ID: "X-File-Id",
  FILE_NAME: "X-File-Name",
  FILE_SIZE: "X-File-Size",
  FILE_TOTAL: "X-File-Total",
};

export const MESSAGE_TYPE = {
  INIT_CHANNEL: "INIT_CHANNEL",
  TRANSFER_START: "TRANSFER_START",
  TRANSFER_CLOSE: "TRANSFER_CLOSE",
} as const;

export type MessageTypeMap = {
  [MESSAGE_TYPE.INIT_CHANNEL]: Record<string, never>;
  [MESSAGE_TYPE.TRANSFER_START]: { id: string; readable: ReadableStream<Uint8Array> };
  [MESSAGE_TYPE.TRANSFER_CLOSE]: { id: string };
};

export type MessageType = Spread<MessageTypeMap>;
