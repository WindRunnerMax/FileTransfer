import type { O } from "@block-kit/utils/dist/es/types";

export const CONNECTION_STATE = {
  READY: "READY",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
} as const;

export const DEVICE_TYPE = {
  MOBILE: "MOBILE",
  PC: "PC",
} as const;

export const MESSAGE_TYPE = {
  TEXT: "TEXT",
  FILE_START: "FILE_START",
  FILE_NEXT: "FILE_NEXT",
  FILE_FINISH: "FILE_FINISH",
} as const;

export const TRANSFER_TYPE = {
  TEXT: "TEXT",
  FILE: "FILE",
  SYSTEM: "SYSTEM",
} as const;

export const TRANSFER_FROM = {
  SELF: "SELF",
  PEER: "PEER",
} as const;

export const NET_TYPE = {
  LAN: "LAN",
  WAN: "WAN",
} as const;

export type DeviceType = O.Values<typeof DEVICE_TYPE>;
export type TransferFrom = O.Values<typeof TRANSFER_FROM>;
export type MessageType = O.Values<typeof MESSAGE_TYPE>;
export type TransferType = O.Values<typeof TRANSFER_TYPE>;
export type ConnectionState = O.Values<typeof CONNECTION_STATE>;
export type NetType = O.Values<typeof NET_TYPE>;

type _Spread<T extends O.Key, M extends Record<O.Key, unknown>> = {
  [P in T]: unknown extends M[P] ? never : M[P] & { key: P };
};
export type Spread<M extends O.Unknown> = O.Values<_Spread<O.Keys<M>, M>>;
export type BufferType = Blob | ArrayBuffer;
export type MessageEntry = Spread<MessageEntryMap>;
export type TransferEntry = Spread<TransferEntryMap>;
export type Member = { id: string; device: DeviceType };
export type FileMeta = { id: string; size: number; total: number };

export type TransferEntryText = { data: string; from: TransferFrom };
export type TransferEntryFile = {
  id: string;
  size: number;
  name: string;
  progress: number;
  from: TransferFrom;
};

export type MessageEntryMap = {
  [MESSAGE_TYPE.TEXT]: { data: string };
  [MESSAGE_TYPE.FILE_START]: { name: string } & FileMeta;
  [MESSAGE_TYPE.FILE_NEXT]: { series: number } & FileMeta;
  [MESSAGE_TYPE.FILE_FINISH]: { id: string };
};

export type TransferEntryMap = {
  [TRANSFER_TYPE.TEXT]: TransferEntryText;
  [TRANSFER_TYPE.FILE]: TransferEntryFile;
  [TRANSFER_TYPE.SYSTEM]: Omit<TransferEntryText, "from">;
};
