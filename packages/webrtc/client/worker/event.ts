import type { BufferType } from "../../types/client";
import { HEADER_KEY } from "../../types/worker";

export class WorkerEvent {
  public static worker: ServiceWorkerRegistration | null = null;

  public static async register(): Promise<ServiceWorkerRegistration> {
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
      console.error("Service Worker Register Error", error);
      return Promise.reject(error);
    }
  }

  public static isTrustEnv() {
    return location.protocol === "https:" || location.hostname === "localhost";
  }

  public static start(fileId: string, fileName: string, fileSize: number, fileTotal: number) {
    const newFileName = encodeURIComponent(fileName)
      .replace(/['()]/g, escape)
      .replace(/\*/g, "%2A");
    const src =
      `/${fileId}` +
      `?${HEADER_KEY.FILE_ID}=${fileId}` +
      `&${HEADER_KEY.FILE_SIZE}=${fileSize}` +
      `&${HEADER_KEY.FILE_TOTAL}=${fileTotal}` +
      `&${HEADER_KEY.FILE_NAME}=${newFileName}`;
    const iframe = document.createElement("iframe");
    iframe.hidden = true;
    iframe.src = src;
    iframe.id = fileId;
    document.body.appendChild(iframe);
  }

  public static post(data: BufferType) {
    if (!WorkerEvent.worker) return;
    WorkerEvent.worker.active?.postMessage(data);
  }

  public static close(fileId: string) {
    const iframe = document.getElementById(fileId);
    iframe && iframe.remove();
  }
}
