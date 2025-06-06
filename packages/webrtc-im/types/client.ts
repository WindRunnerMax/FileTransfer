import type { O } from "@block-kit/utils/dist/es/types";

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

export type DeviceType = O.Values<typeof DEVICE_TYPE>;
export type TransferFrom = O.Values<typeof TRANSFER_FROM>;
export type MessageTypeMap = O.Values<typeof MESSAGE_TYPE>;
export type TransferTypeMap = O.Values<typeof TRANSFER_TYPE>;
