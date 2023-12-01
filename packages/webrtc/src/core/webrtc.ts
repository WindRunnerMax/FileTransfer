import { WebRTCCallback, WebRTCOptions } from "../../types/webrtc";
import { WebRTCInstance } from "./instance";
import { SignalingServer } from "./signaling";
import { getUniqueId } from "laser-utils";

export class WebRTC {
  public readonly id: string;
  private instance: WebRTCInstance | null = null;
  public readonly signaling: SignalingServer;
  public onReady: WebRTCCallback = () => void 0;
  constructor(options: WebRTCOptions) {
    const STORAGE_KEY = "WEBRTC-ID";
    // https://socket.io/docs/v4/server-socket-instance/#socketid
    this.id = sessionStorage?.getItem(STORAGE_KEY) || getUniqueId(20);
    sessionStorage?.setItem(STORAGE_KEY, this.id);
    this.signaling = new SignalingServer(options.wss, this.id);
    this.signaling.socket.on("connect", this.onConnection);
  }

  public onOpen: (ev: Event) => void = () => null;
  public onMessage: (ev: MessageEvent<unknown>) => void = () => null;
  public onError: (ev: Event) => void = () => null;
  public onClose: (ev: Event) => void = () => null;

  private createInstance = () => {
    const onClose = (e: Event) => {
      this.instance?.destroy();
      const rtc = this.createInstance();
      this.instance = rtc;
      this.onClose(e);
    };
    return new WebRTCInstance({
      id: this.id,
      signaling: this.signaling,
      onOpen: this.onOpen,
      onMessage: this.onMessage,
      onError: this.onError,
      onClose: onClose,
    });
  };

  private onConnection = () => {
    if (!this.instance) {
      this.instance = this.createInstance();
    }
    const onConnect = (id: string) => {
      this.instance?.createRemoteConnection(id);
    };
    const onSendMessage = (message: string) => {
      this.instance?.channel.send(message);
    };
    const onClose = () => {
      this.instance?.destroy();
    };
    this.onReady({
      signaling: this.signaling,
      rtc: {
        connect: onConnect,
        send: onSendMessage,
        close: onClose,
      },
    });
  };

  public destroy = () => {
    this.signaling.socket.off("connect", this.onConnection);
    this.signaling.destroy();
    this.instance?.destroy();
  };
}

// Reference
// https://juejin.cn/post/6950234563683713037
// https://juejin.cn/post/7171836076246433799
