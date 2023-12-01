export enum CONNECTION_STATE {
  "INIT",
  "READY",
  "LINKED",
}
export enum DEVICE_TYPE {
  "MOBILE",
  "PC",
}
export type Member = { id: string; device: DEVICE_TYPE };
