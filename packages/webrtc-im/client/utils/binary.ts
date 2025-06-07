export type BufferType = Blob | ArrayBuffer;

// 12B = 96bit => [A-Z] * 12
export const ID_SIZE = 12;
// 4B = 32bit = 2^32 = 4294967296
export const CHUNK_SIZE = 4;
export const STEAM_TYPE = "application/octet-stream";
