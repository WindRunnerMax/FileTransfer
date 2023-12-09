import { CHUNK_SIZE } from "../../types/client";

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
};

export const blobToBase64 = (blob: Blob) => {
  return new Promise<string>(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};

export const base64ToBlob = (base64: string) => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = window.atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
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
