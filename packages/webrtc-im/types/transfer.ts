import type { O, R } from "@block-kit/utils/dist/es/types";

// 12B = 96bit => [A-Z] * 12
export const ID_SIZE = 12;
// 4B = 32bit = 2^32 = 4294967296
export const CHUNK_SIZE = 4;
export const STEAM_TYPE = "application/octet-stream";

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

export const TRANSFER_EVENT = {
  TEXT: "TEXT",
  FILE_START: "FILE_START",
  FILE_PROCESS: "FILE_PROCESS",
} as const;

export type TransferFrom = O.Values<typeof TRANSFER_FROM>;
export type MessageType = O.Values<typeof MESSAGE_TYPE>;
export type TransferType = O.Values<typeof TRANSFER_TYPE>;
export type BufferType = Blob | ArrayBuffer;
export type MessageEntry = R.Spread<MessageEntryMap>;
export type TransferEntry = R.Spread<TransferEntryMap>;
export type FileMeta = { id: string; size: number; total: number };
export type TransferEntryText = { data: string; from: TransferFrom };

export type TransferEntryFile = {
  id: string;
  size: number;
  name: string;
  process: number;
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
  [TRANSFER_TYPE.SYSTEM]: Omit<TransferEntryText, "from"> & { from?: TransferFrom };
};

export type TransferEventMap = {
  [TRANSFER_EVENT.TEXT]: TransferEntryText;
  [TRANSFER_EVENT.FILE_START]: TransferEntryFile;
  [TRANSFER_EVENT.FILE_PROCESS]: { id: string; process: number };
};
