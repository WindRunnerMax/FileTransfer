import { Bind, getId, isString, TSON } from "@block-kit/utils";
import type { FileMeta, MessageEntry, MessageEntryMap } from "../../types/transfer";
import { MESSAGE_TYPE } from "../../types/transfer";
import type { BufferType } from "../utils/binary";
import { CHUNK_SIZE, ID_SIZE } from "../utils/binary";
import { EventBus } from "../utils/event-bus";
import type { WebRTCService } from "./webrtc";
import { WEBRTC_EVENT } from "../../types/webrtc";

export class TransferService {
  /** 正在发送数据 */
  public isSending: boolean;
  /** 分片传输队列 */
  public tasks: BufferType[];
  /** 事件总线 */
  public bus: EventBus<MessageEntryMap>;
  /** 发送文件句柄 */
  public fileHandler: Map<string, Blob>;
  /** 接受文件切片 */
  public fileMapper: Map<string, BufferType[]>;
  /** 文件接收状态 */
  public fileState: Map<string, FileMeta & { series: number }>;

  constructor(private rtc: WebRTCService) {
    this.isSending = false;
    this.tasks = [];
    this.bus = new EventBus<MessageEntryMap>();
    this.fileState = new Map();
    this.fileMapper = new Map();
    this.fileHandler = new Map();
    this.rtc.bus.on(WEBRTC_EVENT.MESSAGE, this.onMessage);
  }

  public destroy() {
    this.reset();
    this.bus.clear();
    this.rtc.bus.off(WEBRTC_EVENT.MESSAGE, this.onMessage);
  }

  /**
   * 重置传输状态
   */
  public reset() {
    this.isSending = false;
    this.tasks = [];
    this.fileState = new Map();
    this.fileMapper = new Map();
    this.fileHandler = new Map();
  }

  public async sendTextMessage(message: MessageEntry) {
    this.rtc.channel.send(TSON.stringify(message)!);
  }

  public async startSendFileList(files: FileList) {
    const maxChunkSize = this.getMaxMessageSize();
    for (const file of files) {
      const name = file.name;
      const id = getId(ID_SIZE);
      const size = file.size;
      const total = Math.ceil(file.size / maxChunkSize);
      this.sendTextMessage({ key: MESSAGE_TYPE.FILE_START, id, name, size, total });
      this.fileHandler.set(id, file);
    }
  }

  /**
   * 接收数据消息
   * @param event
   */
  @Bind
  private async onMessage(event: MessageEvent<string | BufferType>) {
    const { FILE_NEXT } = MESSAGE_TYPE;
    // String - 接收文本类型数据
    if (isString(event.data)) {
      const data = TSON.decode<MessageEntry>(event.data);
      console.log("OnTextMessage", data);
      if (!data || !data.key) return void 0;
      // 收到 发送方 的文本消息
      if (data.key === MESSAGE_TYPE.TEXT) {
        this.bus.emit(MESSAGE_TYPE.TEXT, data);
        return void 0;
      }
      // 收到 发送方 传输起始消息 准备接收数据
      if (data.key === MESSAGE_TYPE.FILE_START) {
        const { id, size, total } = data;
        this.fileState.set(id, { series: 0, ...data });
        // 通知 发送方 发送首个块
        this.sendTextMessage({ key: FILE_NEXT, id, series: 0, size, total });
        this.bus.emit(MESSAGE_TYPE.FILE_START, data);
        return void 0;
      }
      // 收到 接收方 的准备接收块数据消息
      if (data.key === MESSAGE_TYPE.FILE_NEXT) {
        const { id, series } = data;
        const nextChunk = await this.serialize(id, series);
        // 向目标 接收方 发送块数据
        this.enqueue(nextChunk);
        this.bus.emit(MESSAGE_TYPE.FILE_NEXT, data);
        return void 0;
      }
      // 收到 接收方 的接收完成消息
      if (data.key === MESSAGE_TYPE.FILE_FINISH) {
        const { id } = data;
        this.fileState.delete(id);
        this.bus.emit(MESSAGE_TYPE.FILE_FINISH, data);
        return void 0;
      }
      return void 0;
    }
    // Binary - 接收 发送方 ArrayBuffer 数据
    if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
      const blob = event.data;
      const { id, series, data } = await this.deserialize(blob);
      // 在此处只打印关键信息即可 如果全部打印会导致内存占用上升
      // 控制台会实际持有 Buffer 数据 传输文件时会导致占用大量内存
      console.log("OnBinaryMessage", { id, series });
      const state = this.fileState.get(id);
      if (!state) return void 0;
      const { size, total } = state;
      // 数据接收完毕 通知 发送方 接收完毕
      // 数据块序列号 [0, TOTAL)
      if (series >= total) {
        this.sendTextMessage({ key: MESSAGE_TYPE.FILE_FINISH, id });
        this.bus.emit(MESSAGE_TYPE.FILE_FINISH, { id });
        return void 0;
      }
      // 未完成传输, 在内存中存储块数据
      if (series < total) {
        const mapper = this.fileMapper.get(id) || [];
        mapper[series] = data;
        this.fileMapper.set(id, mapper);
        // 通知 发送方 发送下一个序列块
        this.sendTextMessage({ key: FILE_NEXT, id, series: series + 1, size, total });
        this.bus.emit(MESSAGE_TYPE.FILE_NEXT, { id, series, size, total });
        return void 0;
      }
      return void 0;
    }
  }

  /**
   * 序列化文件分片
   */
  private async serialize(id: string, series: number) {
    const file = this.fileHandler.get(id);
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
  private async deserialize(chunk: BufferType) {
    const buffer = chunk instanceof Blob ? await chunk.arrayBuffer() : chunk;
    const id = new Uint8Array(buffer.slice(0, ID_SIZE));
    const series = new Uint8Array(buffer.slice(ID_SIZE, ID_SIZE + CHUNK_SIZE));
    const data = buffer.slice(ID_SIZE + CHUNK_SIZE);
    const idString = String.fromCharCode(...id);
    const seriesNumber = (series[0] << 24) | (series[1] << 16) | (series[2] << 8) | series[3];
    return { id: idString, series: seriesNumber, data };
  }

  /**
   * 入队准备发送数据
   */
  private enqueue(chunk: BufferType) {
    this.tasks.push(chunk);
    !this.isSending && this.startSendBuffer();
  }

  /**
   * 获取最大分片大小
   */
  private getMaxMessageSize(originValue = false) {
    let maxSize = this.rtc.connection.sctp?.maxMessageSize || 64 * 1024;
    // https://developer.mozilla.org/en-US/docs/Web/API/RTCSctpTransport/maxMessageSize
    // https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels
    // 在 FireFox 本机传输会出现超大的值 1073741807, 约 1GB 1073741824byte
    // officially up to 256 KiB, but Firefox's implementation caps them at a whopping 1 GiB
    // 因此在这里需要将其限制为最大 256KB 以保证正确的文件传输以及 WebStream 的正常工作
    maxSize = Math.min(maxSize, 256 * 1024);
    // 最大的原始值, 而不是实际的可用分片大小
    if (originValue) return maxSize;
    // 1KB = 1024B
    // 1B = 8bit => 0-255 00-FF
    return maxSize - ID_SIZE - CHUNK_SIZE;
  }

  /**
   * 正式传输消息
   */
  private async startSendBuffer() {
    this.isSending = true;
    const chunkSize = this.getMaxMessageSize();
    const channel = this.rtc.channel;
    while (this.tasks.length) {
      const next = this.tasks.shift();
      if (!next) break;
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
