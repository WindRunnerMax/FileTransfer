declare let self: ServiceWorkerGlobalScope;
import type { MessageType } from "../../types/worker";
import { HEADER_KEY, MESSAGE_TYPE } from "../../types/worker";

self.addEventListener("install", () => {
  // 跳过等待 直接激活
  self.skipWaiting();
  console.log("Service Worker Installed");
});

self.addEventListener("activate", event => {
  // 激活后立即开始控制所有页面
  event.waitUntil(self.clients.claim());
  console.log("Service Worker Activate");
});

type StreamTuple = [ReadableStream<Uint8Array>];
const map = new Map<string, StreamTuple>();

self.onmessage = event => {
  const port = event.ports[0];
  if (!port) return void 0;
  port.onmessage = event => {
    const payload = event.data as MessageType;
    if (!payload) return void 0;
    if (payload.key === MESSAGE_TYPE.TRANSFER_START) {
      // 直接使用 ReadableStream 需要处理 BackPressure 而 TransformStream 解决了问题
      // controller.enqueue 不能直接写入 ArrayBuffer 必须要写入 TypedArray 类型
      const { id, readable } = payload;
      map.set(id, [readable]);
    }
    if (payload.key === MESSAGE_TYPE.TRANSFER_CLOSE) {
      const { id } = payload;
      map.delete(id);
    }
  };
};

self.onfetch = event => {
  const url = new URL(event.request.url);
  const search = url.searchParams;
  const fileId = search.get(HEADER_KEY.FILE_ID);
  const fileName = search.get(HEADER_KEY.FILE_NAME);
  const fileSize = search.get(HEADER_KEY.FILE_SIZE);
  const fileTotal = search.get(HEADER_KEY.FILE_TOTAL);
  if (!fileId || !fileName || !fileSize || !fileTotal) {
    return fetch(event.request);
  }
  const transfer = map.get(fileId);
  if (!transfer) {
    return null;
  }
  const [readable] = transfer;
  const newFileName = decodeURIComponent(fileName);
  const responseHeader = new Headers({
    [HEADER_KEY.FILE_ID]: fileId,
    [HEADER_KEY.FILE_SIZE]: fileSize,
    [HEADER_KEY.FILE_NAME]: newFileName,
    "Content-Type": "application/octet-stream; charset=utf-8",
    "Content-Security-Policy": "default-src 'none'",
    "X-Content-Security-Policy": "default-src 'none'",
    "X-WebKit-CSP": "default-src 'none'",
    "X-XSS-Protection": "1; mode=block",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Content-Disposition": "attachment; filename*=UTF-8''" + newFileName,
    "Content-Length": fileSize,
  });
  const response = new Response(readable, {
    headers: responseHeader,
  });
  return event.respondWith(response);
};
