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

export const NET_TYPE = {
  LAN: "LAN",
  WAN: "WAN",
} as const;

export type DeviceType = O.Values<typeof DEVICE_TYPE>;
export type ConnectionState = O.Values<typeof CONNECTION_STATE>;
export type NetType = O.Values<typeof NET_TYPE>;
export type Member = { id: string; device: DeviceType };
