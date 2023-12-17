export const CHUNK_SIZE = 1024 * 256; // 256KB

export type Member = { id: string; device: DEVICE_TYPE };
export enum CONNECTION_STATE {
  "READY",
  "CONNECTING",
  "CONNECTED",
}
export enum DEVICE_TYPE {
  "MOBILE",
  "PC",
}

export type ChunkType = Blob | ArrayBuffer;
type FileType = { id: string; size: number; total: number };

export type SocketMessageType =
  | { type: "text"; data: string }
  | ({ type: "file-start"; name: string } & FileType)
  | ({ type: "file-next"; current: number } & FileType)
  | ({ type: "file-chunk"; current: number; chunk: string } & FileType)
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
