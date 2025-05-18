import type { WebRTCCallback, WebRTCOptions } from "../../types/webrtc";
import { WebRTCInstance } from "./instance";
import { SignalingServer } from "./signaling";
import { getUniqueId } from "laser-utils";

export class WebRTC {
  /** 连接 id */
  public readonly id: string;
  /** RTC 实例 */
  private instance: WebRTCInstance | null = null;
  /** 信令服务器 */
  public readonly signaling: SignalingServer;
  /** Ready 事件 */
  public onReady: WebRTCCallback;
  /** RTC Open 事件 */
  public onOpen: (event: Event) => void;
  /** RTC Message 事件 */
  public onMessage: (event: MessageEvent<string | ArrayBuffer>) => void;
  /** RTC Error 事件 */
  public onError: (event: RTCErrorEvent) => void;
  /** RTC Close 事件 */
  public onClose: (event: Event) => void;
  /** RTC Connection State Change 事件 */
  public onConnectionStateChange: (pc: RTCPeerConnection) => void;

  constructor(options: WebRTCOptions) {
    this.onReady = () => null;
    this.onOpen = () => null;
    this.onMessage = () => null;
    this.onError = () => null;
    this.onClose = () => null;
    this.onConnectionStateChange = () => null;
    const STORAGE_KEY = "WEBRTC-ID";
    // https://socket.io/docs/v4/server-socket-instance/#socketid
    this.id = sessionStorage?.getItem(STORAGE_KEY) || getUniqueId(8);
    sessionStorage?.setItem(STORAGE_KEY, this.id);
    this.signaling = new SignalingServer(options.wss, this.id);
    this.signaling.socket.on("connect", this.onConnection);
  }

  private createInstance = () => {
    const onOpen = (e: Event) => {
      this.onOpen(e);
    };
    const onMessage = (event: MessageEvent<string | ArrayBuffer>) => {
      this.onMessage(event);
    };
    const onError = (event: RTCErrorEvent) => {
      this.onError(event);
    };
    const onClose = (e: Event) => {
      this.instance?.destroy();
      const rtc = this.createInstance();
      this.instance = rtc;
      this.onClose(e);
    };
    const onConnectionStateChange = (pc: RTCPeerConnection) => {
      this.onConnectionStateChange(pc);
    };
    return new WebRTCInstance({
      id: this.id,
      signaling: this.signaling,
      onOpen: onOpen,
      onMessage: onMessage,
      onError: onError,
      onClose: onClose,
      onConnectionStateChange,
    });
  };

  private onConnection = () => {
    // FIX: 当 RTC 保持连接但是信令断开重连时, 不重置实例状态
    // 在移动端浏览器置于后台再切换到前台时可能会导致这个情况的发生
    if (this.instance && this.instance.connection.connectionState === "connected") {
      return void 0;
    }
    if (!this.instance) {
      this.instance = this.createInstance();
    }
    const onConnect = (id: string) => {
      if (
        !this.instance ||
        this.instance.connection.currentLocalDescription ||
        this.instance.connection.currentRemoteDescription
      ) {
        this.instance = this.createInstance();
      }
      this.instance.createRemoteConnection(id);
      return this.instance.ready;
    };
    const onSendMessage = (message: string | Blob | ArrayBuffer | ArrayBufferView) => {
      this.instance?.channel.send(message as Blob);
    };
    const onClose = () => {
      this.instance?.destroy();
      this.instance = this.createInstance();
    };
    this.onReady({
      signaling: this.signaling,
      rtc: {
        connect: onConnect,
        send: onSendMessage,
        close: onClose,
        getInstance: () => this.instance,
      },
    });
  };

  public destroy = () => {
    this.signaling.socket.off("connect", this.onConnection);
    this.signaling.destroy();
    this.instance?.destroy();
    this.instance = null;
  };
}
