import { ChunkType, FileType } from "../../types/client";
import { WebRTCApi } from "../../types/webrtc";

export const ID_SIZE = 12; // `12B = 96bit [A B C ...]`
export const CHUNK_SIZE = 4; // `4B = 32bit = 2^32 = 4294967296`
export const STEAM_TYPE = "application/octet-stream";
export const FILE_SOURCE: Map<string, Blob> = new Map();
export const FILE_MAPPER: Map<string, ChunkType[]> = new Map();
export const FILE_STATE: Map<string, FileType & { series: number }> = new Map();

export const getMaxMessageSize = (
  rtc: React.MutableRefObject<WebRTCApi | null>,
  origin = false
) => {
  const instance = rtc.current?.getInstance();
  const maxSize = instance?.connection.sctp?.maxMessageSize || 64 * 1024;
  if (origin) {
    return maxSize;
  }
  // `1KB = 1024B 1B = 8bit 0-255`
  return maxSize - (ID_SIZE + CHUNK_SIZE);
};

export const getNextChunk = (
  instance: React.MutableRefObject<WebRTCApi | null>,
  id: string,
  series: number
) => {
  const file = FILE_SOURCE.get(id);
  const chunkSize = getMaxMessageSize(instance);
  if (!file) return new Blob([new ArrayBuffer(chunkSize)]);
  const start = series * chunkSize;
  const end = Math.min(start + chunkSize, file.size);
  const idBlob = new Uint8Array(id.split("").map(char => char.charCodeAt(0)));
  const seriesBlob = new Uint8Array(4);
  // `0xff = 1111 1111`
  seriesBlob[0] = (series >> 24) & 0xff;
  seriesBlob[1] = (series >> 16) & 0xff;
  seriesBlob[2] = (series >> 8) & 0xff;
  seriesBlob[3] = series & 0xff;
  return new Blob([idBlob, seriesBlob, file.slice(start, end)]);
};

let isSending = false;
const QUEUE_TASK: ChunkType[] = [];
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
  chunk: ChunkType
) => {
  QUEUE_TASK.push(chunk);
  !isSending && start(rtc);
};

export const destructureChunk = async (chunk: ChunkType) => {
  const buffer = chunk instanceof Blob ? await chunk.arrayBuffer() : chunk;
  const id = new Uint8Array(buffer.slice(0, ID_SIZE));
  const series = new Uint8Array(buffer.slice(ID_SIZE, ID_SIZE + CHUNK_SIZE));
  const data = chunk.slice(ID_SIZE + CHUNK_SIZE);
  const idString = String.fromCharCode(...id);
  const seriesNumber = (series[0] << 24) | (series[1] << 16) | (series[2] << 8) | series[3];
  return { id: idString, series: seriesNumber, data };
};
