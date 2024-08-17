declare let self: ServiceWorkerGlobalScope;
import type { BufferType } from "../../types/client";
import { HEADER_KEY } from "../../types/worker";
import { destructureChunk } from "../utils/binary";

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

type StreamTuple = [ReadableStream, ReadableStreamDefaultController<BufferType>, number];
const map = new Map<string, StreamTuple>();

self.onmessage = event => {
  const data = <BufferType>event.data;
  destructureChunk(data).then(({ id, series, data }) => {
    const stream = map.get(id);
    if (!stream) return void 0;
    const [, controller, size] = stream;
    controller.enqueue(data);
    // 数据块序列号 [0, TOTAL)
    if (series === size - 1) {
      controller.close();
      map.delete(id);
    }
  });
};

self.onfetch = event => {
  const headers = event.request.headers;
  const fileId = headers.get(HEADER_KEY.FILE_ID);
  const fileName = headers.get(HEADER_KEY.FILE_NAME);
  const fileSize = headers.get(HEADER_KEY.FILE_SIZE);
  if (fileId && fileName && fileSize) {
    const newFileName = encodeURIComponent(fileName)
      .replace(/['()]/g, escape)
      .replace(/\*/g, "%2A");
    let controller: ReadableStreamDefaultController | null = null;
    const readable = new ReadableStream({
      start(ctr) {
        controller = ctr;
      },
      cancel(reason) {
        console.log("ReadableStream Aborted", reason);
      },
    });
    map.set(fileId, [readable, controller!, Number(fileSize)]);
    const response = new Response(readable, {
      headers: {
        [HEADER_KEY.FILE_ID]: fileId,
        [HEADER_KEY.FILE_NAME]: newFileName,
        [HEADER_KEY.FILE_SIZE]: fileSize,
        "Content-Type": "application/octet-stream; charset=utf-8",
        "Content-Security-Policy": "default-src 'none'",
        "X-Content-Security-Policy": "default-src 'none'",
        "X-WebKit-CSP": "default-src 'none'",
        "X-XSS-Protection": "1; mode=block",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Content-Disposition": "attachment; filename*=UTF-8''" + newFileName,
        "Content-Length": fileSize,
      },
    });
    return event.respondWith(response);
  }
  return fetch(event.request);
};
