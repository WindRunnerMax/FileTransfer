export enum CONNECTION_STATE {
  "INIT",
  "READY",
  "CONNECTING",
  "CONNECTED",
}
export enum DEVICE_TYPE {
  "MOBILE",
  "PC",
}
export type Member = { id: string; device: DEVICE_TYPE };

export type TextMessageType =
  | { type: "text"; data: string }
  | { type: "file"; data: { size: number; name: string } };
export type TransferListItem =
  | { type: "text"; data: string; from: "self" | "peer" }
  | { type: "file"; size: number; name: string; progress: number; from: "self" | "peer" };