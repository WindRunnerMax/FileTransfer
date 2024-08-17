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
    // 需要处理 BackPressure 而 TransformStream 解决了问题
    // 不能直接写入 ArrayBuffer 必须要写入 TypedArray 类型
    controller.enqueue(new Uint8Array(data));
    // 数据块序列号 [0, TOTAL)
    if (series === size - 1) {
      controller.close();
      map.delete(id);
    }
  });
};

self.onfetch = event => {
  const url = new URL(event.request.url);
  const search = url.searchParams;
  const fileId = search.get(HEADER_KEY.FILE_ID);
  const fileName = search.get(HEADER_KEY.FILE_NAME);
  const fileSize = search.get(HEADER_KEY.FILE_SIZE);
  const fileTotal = search.get(HEADER_KEY.FILE_TOTAL);
  if (fileId && fileName && fileSize && fileTotal) {
    const newFileName = decodeURIComponent(fileName);
    let controller: ReadableStreamDefaultController | null = null;
    const readable = new ReadableStream({
      start(ctr) {
        controller = ctr;
      },
      cancel(reason) {
        console.log("ReadableStream Aborted", reason);
      },
    });
    map.set(fileId, [readable, controller!, Number(fileTotal)]);
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
  }
  return fetch(event.request);
};
