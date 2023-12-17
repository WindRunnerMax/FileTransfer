export type Member = { id: string; device: DEVICE_TYPE };
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

export type ChunkType = Blob | ArrayBuffer;
export type FileType = { id: string; size: number; total: number };
export type TextMessageType =
  | { type: "text"; data: string }
  | { type: "file-finish"; id: string }
  | ({ type: "file-start"; name: string } & FileType)
  | ({ type: "file-next"; series: number } & FileType);

export type TransferListItem =
  | { type: "text"; data: string; from: "self" | "peer" }
  | {
      type: "file";
      size: number;
      name: string;
      progress: number;
      id: string;
      from: "self" | "peer";
    };
