import { CHUNK_SIZE } from "../../types/client";
import pako from "pako";
import { Base64 } from "js-base64";
export { formatBytes, onScroll } from "@ft/webrtc/client/utils/format";

export const blobToBase64 = async (blob: Blob) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = new Uint8Array(reader.result as ArrayBuffer);
      const compress = pako.deflate(data);
      resolve(Base64.fromUint8Array(compress));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};

export const base64ToBlob = (base64: string) => {
  const bytes = Base64.toUint8Array(base64);
  const decompress = pako.inflate(bytes);
  const blob = new Blob([decompress]);
  return blob;
};

export const getChunkByIndex = (file: Blob, current: number): Promise<string> => {
  const start = current * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE, file.size);
  return blobToBase64(file.slice(start, end));
};
