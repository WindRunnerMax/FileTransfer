import type { MessageType } from "../../types/worker";
import { HEADER_KEY, MESSAGE_TYPE } from "../../types/worker";

export class WorkerEvent {
  public static channel: MessageChannel | null = null;
  public static worker: ServiceWorkerRegistration | null = null;
  public static writer: Map<string, WritableStreamDefaultWriter<Uint8Array>> = new Map();

  public static async register(): Promise<ServiceWorkerRegistration | null> {
    if (!navigator.serviceWorker) {
      console.warn("Service Worker Not Supported");
      return Promise.resolve(null);
    }
    try {
      const serviceWorker = await navigator.serviceWorker.getRegistration("./");
      if (serviceWorker) {
        WorkerEvent.worker = serviceWorker;
        return Promise.resolve(serviceWorker);
      }
      const worker = await navigator.serviceWorker.register(
        process.env.PUBLIC_PATH + "worker.js?" + process.env.RANDOM_ID,
        { scope: "./" }
      );
      WorkerEvent.worker = worker;
      return worker;
    } catch (error) {
      console.warn("Service Worker Register Error", error);
      return Promise.resolve(null);
    }
  }

  public static isTrustEnv() {
    return location.protocol === "https:" || location.hostname === "localhost";
  }

  public static start(fileId: string, fileName: string, fileSize: number, fileTotal: number) {
    if (!WorkerEvent.channel) {
      WorkerEvent.channel = new MessageChannel();
      WorkerEvent.channel.port1.onmessage = event => {
        console.log("WorkerEvent", event.data);
      };
      WorkerEvent.worker?.active?.postMessage({ type: MESSAGE_TYPE.INIT_CHANNEL }, [
        WorkerEvent.channel.port2,
      ]);
    }
    // 在 TransformStream 不可用的情况下 https://caniuse.com/?search=TransformStream
    // 需要在 Service Worker 中使用 ReadableStream 写入数据 fa28d9d757ddeda9c93645362
    // 相当于通过 controller.enqueue 将 ArrayBuffer 数据写入即可
    // 而直接使用 ReadableStream 需要主动处理 BackPressure 时降低写频率
    // 此时使用 TransformStream 实际上是内部实现了 BackPressure 的自动处理机制
    const ts = new TransformStream();
    WorkerEvent.channel.port1.postMessage(
      <MessageType>{
        key: MESSAGE_TYPE.TRANSFER_START,
        id: fileId,
        readable: ts.readable,
      },
      // 转移所有权至 Service Worker
      [ts.readable]
    );
    WorkerEvent.writer.set(fileId, ts.writable.getWriter());
    // 需要通过 iframe 发起下载请求, 在 Service Worker 中拦截请求
    // 这里如果 A 的 DOM 上引用了 B 的 iframe 框架
    // 此时 B 中存在的 SW 可以拦截 A 的 iframe 创建的请求
    // 当然前提是 A 创建的 iframe 请求是请求的 B 源下的地址
    const src =
      `/${fileId}` +
      `?${HEADER_KEY.FILE_ID}=${fileId}` +
      `&${HEADER_KEY.FILE_SIZE}=${fileSize}` +
      `&${HEADER_KEY.FILE_TOTAL}=${fileTotal}` +
      `&${HEADER_KEY.FILE_NAME}=${fileName}`;
    const iframe = document.createElement("iframe");
    iframe.hidden = true;
    iframe.src = src;
    iframe.id = fileId;
    document.body.appendChild(iframe);
  }

  public static async post(fileId: string, data: ArrayBuffer) {
    const writer = WorkerEvent.writer.get(fileId);
    if (!writer) return void 0;
    // 感知 BackPressure 需要主动 await ready
    await writer.ready;
    return writer.write(new Uint8Array(data));
  }

  public static close(fileId: string) {
    const iframe = document.getElementById(fileId);
    iframe && iframe.remove();
    WorkerEvent.channel?.port1.postMessage(<MessageType>{
      key: MESSAGE_TYPE.TRANSFER_CLOSE,
      id: fileId,
    });
    const writer = WorkerEvent.writer.get(fileId);
    // 必须关闭 Writer 否则浏览器无法感知下载完成
    writer?.close();
    WorkerEvent.writer.delete(fileId);
  }
}
