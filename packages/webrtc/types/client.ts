import type { Object } from "laser-utils";

export const CONNECTION_STATE = {
  INIT: "INIT",
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
} as const;

export const TRANSFER_FROM = {
  SELF: "SELF",
  PEER: "PEER",
} as const;

export type MessageTypeMap = {
  [MESSAGE_TYPE.TEXT]: { data: string };
  [MESSAGE_TYPE.FILE_START]: { name: string } & FileMeta;
  [MESSAGE_TYPE.FILE_NEXT]: { series: number } & FileMeta;
  [MESSAGE_TYPE.FILE_FINISH]: { id: string };
};

export type TransferTypeMap = {
  [TRANSFER_TYPE.TEXT]: {
    data: string;
    from: Object.Values<typeof TRANSFER_FROM>;
  };
  [TRANSFER_TYPE.FILE]: Omit<FileMeta, "total"> & {
    name: string;
    progress: number;
    from: Object.Values<typeof TRANSFER_FROM>;
  };
};

type _Spread<T extends Object.KeyType, M extends Record<Object.KeyType, unknown>> = {
  [P in T]: unknown extends M[P] ? never : M[P] & { key: P };
};
export type Spread<M extends Object.Unknown> = Object.Values<_Spread<Object.Keys<M>, M>>;
export type BufferType = Blob | ArrayBuffer;
export type MessageType = Spread<MessageTypeMap>;
export type TransferType = Spread<TransferTypeMap>;
export type Member = { id: string; device: DeviceType };
export type DeviceType = Object.Values<typeof DEVICE_TYPE>;
export type FileMeta = { id: string; size: number; total: number };
export type ConnectionState = Object.Values<typeof CONNECTION_STATE>;
