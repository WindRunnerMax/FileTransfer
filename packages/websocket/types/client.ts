export const CHUNK_SIZE = 1024 * 256; // 256KB
export type ChunkType = Blob | ArrayBuffer;
export type Member = { id: string; device: DEVICE_TYPE };
export type FileMeta = { id: string; size: number; total: number };

export enum CONNECTION_STATE {
  "READY",
  "CONNECTING",
  "CONNECTED",
}

export enum DEVICE_TYPE {
  "MOBILE",
  "PC",
}

export type SocketMessageType =
  | { type: "text"; data: string }
  | ({ type: "file-start"; name: string } & FileMeta)
  | ({ type: "file-next"; current: number } & FileMeta)
  | ({ type: "file-chunk"; current: number; chunk: string } & FileMeta)
  | { type: "file-finish"; id: string };

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
