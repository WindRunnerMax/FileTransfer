import type { BufferType, FileMeta } from "../../types/client";
import type { WebRTCApi } from "../../types/webrtc";

// 12B = 96bit => [A-Z] * 12
export const ID_SIZE = 12;
// 4B = 32bit = 2^32 = 4294967296
export const CHUNK_SIZE = 4;
export const STEAM_TYPE = "application/octet-stream";
export const FILE_HANDLE: Map<string, Blob> = new Map();
export const FILE_MAPPER: Map<string, BufferType[]> = new Map();
export const FILE_STATE: Map<string, FileMeta & { series: number }> = new Map();

export const getMaxMessageSize = (
  rtc: React.MutableRefObject<WebRTCApi | null>,
  origin = false
) => {
  const instance = rtc.current?.getInstance();
  let maxSize = instance?.connection.sctp?.maxMessageSize || 64 * 1024;
  // https://developer.mozilla.org/en-US/docs/Web/API/RTCSctpTransport/maxMessageSize
  // https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels
  // 在 FireFox 本机传输会出现超大的值 1073741807, 约 1GB 1073741824byte
  // officially up to 256 KiB, but Firefox's implementation caps them at a whopping 1 GiB
  // 因此在这里需要将其限制为最大 256KB 以保证正确的文件传输以及 WebStream 的正常工作
  maxSize = Math.min(maxSize, 256 * 1024);
  if (origin) {
    return maxSize;
  }
  // 1KB = 1024B
  // 1B = 8bit => 0-255 00-FF
  return maxSize - (ID_SIZE + CHUNK_SIZE);
};

export const serializeNextChunk = (
  instance: React.MutableRefObject<WebRTCApi | null>,
  id: string,
  series: number
) => {
  const file = FILE_HANDLE.get(id);
  const chunkSize = getMaxMessageSize(instance);
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
};

let isSending = false;
const QUEUE_TASK: BufferType[] = [];
const start = async (rtc: React.MutableRefObject<WebRTCApi | null>) => {
  isSending = true;
  const chunkSize = getMaxMessageSize(rtc, true);
  const instance = rtc.current?.getInstance();
  const channel = instance?.channel;
  while (QUEUE_TASK.length) {
    const next = QUEUE_TASK.shift();
    if (next && channel && rtc.current) {
      if (channel.bufferedAmount >= chunkSize) {
        await new Promise(resolve => {
          channel.onbufferedamountlow = () => resolve(0);
        });
      }
      const buffer = next instanceof Blob ? await next.arrayBuffer() : next;
      buffer && rtc.current.send(buffer);
    } else {
      break;
    }
  }
  isSending = false;
};

export const sendChunkMessage = async (
  rtc: React.MutableRefObject<WebRTCApi | null>,
  chunk: BufferType
) => {
  // 实现分片传输队列
  QUEUE_TASK.push(chunk);
  !isSending && start(rtc);
};

export const deserializeChunk = async (chunk: BufferType) => {
  const buffer = chunk instanceof Blob ? await chunk.arrayBuffer() : chunk;
  const id = new Uint8Array(buffer.slice(0, ID_SIZE));
  const series = new Uint8Array(buffer.slice(ID_SIZE, ID_SIZE + CHUNK_SIZE));
  const data = buffer.slice(ID_SIZE + CHUNK_SIZE);
  const idString = String.fromCharCode(...id);
  const seriesNumber = (series[0] << 24) | (series[1] << 16) | (series[2] << 8) | series[3];
  return { id: idString, series: seriesNumber, data };
};
