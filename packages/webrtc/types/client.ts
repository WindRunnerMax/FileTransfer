export type ChunkType = Blob | ArrayBuffer;
export type Member = { id: string; device: DEVICE_TYPE };
export type FileMeta = { id: string; size: number; total: number };

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

export type TextMessageType =
  | { type: "text"; data: string }
  | { type: "file-finish"; id: string }
  | ({ type: "file-start"; name: string } & FileMeta)
  | ({ type: "file-next"; series: number } & FileMeta);

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
