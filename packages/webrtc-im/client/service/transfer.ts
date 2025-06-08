import type { BufferType } from "../utils/binary";
import { CHUNK_SIZE, ID_SIZE } from "../utils/binary";
import type { SignalService } from "./signal";
import type { WebRTCService } from "./webrtc";

export class TransferService {
  /** 正在发送数据 */
  public isSending: boolean;
  /** 分片传输队列 */
  public tasks: BufferType[];

  constructor(public signal: SignalService, public rtc: WebRTCService) {
    this.isSending = false;
    this.tasks = [];
  }

  /**
   * 入队准备发送数据
   */
  public enqueue(chunk: BufferType) {
    this.tasks.push(chunk);
    !this.isSending && this.startSendBuffer();
  }

  /**
   * 重置传输状态
   */
  public reset() {
    this.isSending = false;
    this.tasks = [];
  }

  /**
   * 获取最大分片大小
   */
  public getMaxMessageSize(originValue = false) {
    let maxSize = this.rtc.connection.sctp?.maxMessageSize || 64 * 1024;
    // https://developer.mozilla.org/en-US/docs/Web/API/RTCSctpTransport/maxMessageSize
    // https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels
    // 在 FireFox 本机传输会出现超大的值 1073741807, 约 1GB 1073741824byte
    // officially up to 256 KiB, but Firefox's implementation caps them at a whopping 1 GiB
    // 因此在这里需要将其限制为最大 256KB 以保证正确的文件传输以及 WebStream 的正常工作
    maxSize = Math.min(maxSize, 256 * 1024);
    if (originValue) {
      return maxSize;
    }
    // 1KB = 1024B
    // 1B = 8bit => 0-255 00-FF
    return maxSize - (ID_SIZE + CHUNK_SIZE);
  }

  /**
   * 序列化文件分片
   */
  public serialize(file: File, id: string, series: number) {
    const chunkSize = this.getMaxMessageSize();
    if (!file) return new Blob([new ArrayBuffer(chunkSize)]);
    const start = series * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    // 创建 12 字节用于存储 id [12B = 96bit]
    const idBytes = new Uint8Array(id.split("").map(char => char.charCodeAt(0)));
    // 创建 4 字节用于存储序列号 [4B = 32bit]
    const serialBytes = new Uint8Array(4);
    // 0xff = 1111 1111 确保结果只包含低 8 位
    serialBytes[0] = (series >> 24) & 0xff;
    serialBytes[1] = (series >> 16) & 0xff;
    serialBytes[2] = (series >> 8) & 0xff;
    serialBytes[3] = series & 0xff;
    return new Blob([idBytes, serialBytes, file.slice(start, end)]);
  }

  /**
   * 反序列化文件分片
   */
  public async deserialize(chunk: BufferType) {
    const buffer = chunk instanceof Blob ? await chunk.arrayBuffer() : chunk;
    const id = new Uint8Array(buffer.slice(0, ID_SIZE));
    const series = new Uint8Array(buffer.slice(ID_SIZE, ID_SIZE + CHUNK_SIZE));
    const data = buffer.slice(ID_SIZE + CHUNK_SIZE);
    const idString = String.fromCharCode(...id);
    const seriesNumber = (series[0] << 24) | (series[1] << 16) | (series[2] << 8) | series[3];
    return { id: idString, series: seriesNumber, data };
  }

  private async startSendBuffer() {
    this.isSending = true;
    const chunkSize = this.getMaxMessageSize();
    const channel = this.rtc.channel;
    while (this.tasks.length) {
      const next = this.tasks.shift();
      if (!next) {
        break;
      }
      if (channel.bufferedAmount >= chunkSize) {
        await new Promise(resolve => {
          channel.onbufferedamountlow = () => resolve(0);
        });
      }
      const buffer = next instanceof Blob ? await next.arrayBuffer() : next;
      buffer && this.rtc.channel.send(buffer);
    }
    this.isSending = false;
  }
}
