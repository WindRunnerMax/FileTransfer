import { CHUNK_SIZE } from "../../types/client";
import pako from "pako";
import { Base64 } from "js-base64";

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
};

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

export const onScroll = (listRef: React.RefObject<HTMLDivElement>) => {
  if (listRef.current) {
    const el = listRef.current;
    Promise.resolve().then(() => {
      el.scrollTop = el.scrollHeight;
    });
  }
};
