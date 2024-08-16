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
    this.id = sessionStorage?.getItem(STORAGE_KEY) || getUniqueId(8);
    sessionStorage?.setItem(STORAGE_KEY, this.id);
    this.signaling = new SignalingServer(options.wss, this.id);
    this.signaling.socket.on("connect", this.onConnection);
  }

  public onOpen: (event: Event) => void = () => null;
  public onMessage: (event: MessageEvent<string | ArrayBuffer>) => void = () => null;
  public onError: (event: RTCErrorEvent) => void = () => null;
  public onClose: (event: Event) => void = () => null;
  public onConnectionStateChange: (pc: RTCPeerConnection) => void = () => null;

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
