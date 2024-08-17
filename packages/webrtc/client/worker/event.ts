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
}
