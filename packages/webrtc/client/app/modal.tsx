import { WebRTCApi } from "../../types/webrtc";
import styles from "./index.module.scss";
import React, { FC, useEffect, useRef, useState } from "react";
import { CONNECTION_STATE, ChunkType, TextMessageType, TransferListItem } from "../../types/client";
import { Button, Input, Modal, Progress } from "@arco-design/web-react";
import { IconFile, IconRight, IconSend, IconToBottom } from "@arco-design/web-react/icon";
import { WebRTC } from "../bridge/webrtc";
import { useMemoFn } from "laser-utils";
import { cs, getUniqueId, isString } from "laser-utils";
import { TSON } from "../utils/tson";
import { formatBytes, onScroll } from "../utils/format";
import {
  FILE_MAPPER,
  FILE_HANDLE,
  FILE_STATE,
  ID_SIZE,
  STEAM_TYPE,
  destructureChunk,
  getMaxMessageSize,
  getNextChunk,
  sendChunkMessage,
} from "../utils/binary";

export const TransferModal: FC<{
  connection: React.MutableRefObject<WebRTC | null>;
  rtc: React.MutableRefObject<WebRTCApi | null>;
  id: string;
  setId: (id: string) => void;
  peerId: string;
  setPeerId: (id: string) => void;
  state: CONNECTION_STATE;
  setState: (state: CONNECTION_STATE) => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}> = ({ connection, rtc, state, peerId, visible, setVisible, setPeerId, setState }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [toConnectId, setToConnectId] = useState("");
  const [list, setList] = useState<TransferListItem[]>([]);

  const onCancel = () => {
    rtc.current?.close();
    setState(CONNECTION_STATE.READY);
    setVisible(false);
  };

  const sendTextMessage = (message: TextMessageType) => {
    rtc.current?.send(TSON.encode(message));
  };

  const updateFileProgress = (id: string, progress: number, newList = list) => {
    const last = newList.find(item => item.type === "file" && item.id === id);
    if (last && last.type === "file") {
      last.progress = progress;
      setList([...newList]);
    }
  };

  const onMessage = useMemoFn((event: MessageEvent<string | ChunkType>) => {
    console.log("onMessage", event);
    if (isString(event.data)) {
      // String - 接收文本类型数据
      const data = TSON.decode(event.data);
      if (!data) return void 0;
      if (data.type === "text") {
        // 收到 发送方 的文本消息
        setList([...list, { from: "peer", ...data }]);
      } else if (data.type === "file-start") {
        // 收到 发送方 传输起始消息 准备接收数据
        const { id, name, size, total } = data;
        FILE_STATE.set(id, { series: 0, ...data });
        // 通知 发送方 发送首个块
        sendTextMessage({ type: "file-next", id, series: 0, size, total });
        setList([...list, { type: "file", from: "peer", name, size, progress: 0, id }]);
      } else if (data.type === "file-next") {
        // 收到 接收方 的准备接收消息
        const { id, series, total } = data;
        const progress = Math.floor((series / total) * 100);
        updateFileProgress(id, progress);
        const nextChunk = getNextChunk(rtc, id, series);
        // 通知 接收方 发送块数据
        sendChunkMessage(rtc, nextChunk);
      } else if (data.type === "file-finish") {
        // 收到 接收方 的接收完成消息
        const { id } = data;
        FILE_STATE.delete(id);
        updateFileProgress(id, 100);
      }
    } else {
      // Binary - 接收 发送方 ArrayBuffer 数据
      const blob = event.data;
      destructureChunk(blob).then(({ id, series, data }) => {
        const state = FILE_STATE.get(id);
        if (!state) return void 0;
        const { size, total } = state;
        const progress = Math.floor((series / total) * 100);
        updateFileProgress(id, progress);
        if (series >= total) {
          // 数据接收完毕 通知 发送方 接收完毕
          sendTextMessage({ type: "file-finish", id });
        } else {
          const mapper = FILE_MAPPER.get(id) || [];
          mapper[series] = data;
          FILE_MAPPER.set(id, mapper);
          // 通知 发送方 发送下一个序列块
          sendTextMessage({ type: "file-next", id, series: series + 1, size, total });
        }
      });
    }
    onScroll(listRef);
  });

  const onConnectionStateChange = useMemoFn((pc: RTCPeerConnection) => {
    switch (pc.connectionState) {
      case "new":
      case "connecting":
        setState(CONNECTION_STATE.CONNECTING);
        break;
      case "connected":
        setState(CONNECTION_STATE.CONNECTED);
        break;
      case "disconnected":
      case "closed":
      case "failed":
        setState(CONNECTION_STATE.READY);
        break;
    }
  });

  useEffect(() => {
    const current = connection.current;
    if (current) {
      current.onMessage = onMessage;
      current.onConnectionStateChange = onConnectionStateChange;
    }
    return () => {
      const noop = () => null;
      if (current) {
        current.onMessage = noop;
        current.onConnectionStateChange = noop;
      }
    };
  }, [connection, onConnectionStateChange, onMessage]);

  const onSendText = () => {
    if (rtc.current && text) {
      sendTextMessage({ type: "text", data: text });
      setList([...list, { type: "text", from: "self", data: text }]);
      setText("");
      onScroll(listRef);
    }
  };

  const sendFilesBySlice = async (files: FileList) => {
    const maxChunkSize = getMaxMessageSize(rtc);
    const newList = [...list];
    for (const file of files) {
      const name = file.name;
      const id = getUniqueId(ID_SIZE);
      const size = file.size;
      const total = Math.ceil(file.size / maxChunkSize);
      sendTextMessage({ type: "file-start", id, name, size, total });
      FILE_HANDLE.set(id, file);
      newList.push({ type: "file", from: "self", name, size, progress: 0, id } as const);
    }
    setList(newList);
    onScroll(listRef);
  };

  const onSendFile = () => {
    const KEY = "webrtc-file-input";
    const exist = document.querySelector(`body > [data-type='${KEY}']`) as HTMLInputElement;
    const input: HTMLInputElement = exist || document.createElement("input");
    input.value = "";
    input.setAttribute("data-type", KEY);
    input.setAttribute("type", "file");
    input.setAttribute("class", styles.fileInput);
    input.setAttribute("accept", "*");
    input.setAttribute("multiple", "true");
    !exist && document.body.append(input);
    input.onchange = e => {
      const target = e.target as HTMLInputElement;
      document.body.removeChild(input);
      const files = target.files;
      files && sendFilesBySlice(files);
    };
    input.click();
  };

  const onDownloadFile = (id: string, fileName: string) => {
    const blob = FILE_MAPPER.get(id)
      ? new Blob(FILE_MAPPER.get(id), { type: STEAM_TYPE })
      : FILE_HANDLE.get(id) || new Blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onConnectPeer = () => {
    if (toConnectId && rtc.current) {
      rtc.current.connect(toConnectId);
      setPeerId(toConnectId);
      setState(CONNECTION_STATE.CONNECTING);
    }
  };

  const enableTransfer = state === CONNECTION_STATE.CONNECTED;

  return (
    <Modal
      className={styles.modal}
      title={
        <div className={styles.title}>
          <div
            className={styles.dot}
            style={{
              backgroundColor:
                state === CONNECTION_STATE.READY
                  ? "rgb(var(--red-6))"
                  : state === CONNECTION_STATE.CONNECTING
                  ? "rgb(var(--orange-6))"
                  : state === CONNECTION_STATE.CONNECTED
                  ? "rgb(var(--green-6))"
                  : "rgb(var(--gray-6))",
            }}
          ></div>
          {peerId
            ? state === CONNECTION_STATE.READY
              ? "Disconnected: " + peerId
              : state === CONNECTION_STATE.CONNECTING
              ? "Connecting: " + peerId
              : state === CONNECTION_STATE.CONNECTED
              ? "Connected: " + peerId
              : "Unknown State: " + peerId
            : "Please Establish Connection"}
        </div>
      }
      visible={visible}
      footer={null}
      onCancel={onCancel}
      maskClosable={false}
    >
      <div className={styles.modalContent} ref={listRef}>
        {list.map((item, index) => (
          <div
            key={index}
            className={cs(styles.messageItem, item.from === "self" && styles.alignRight)}
          >
            <div className={styles.messageContent}>
              {item.type === "text" ? (
                <span>{item.data}</span>
              ) : (
                <div className={styles.fileMessage}>
                  <div className={styles.fileInfo}>
                    <div>
                      <div className={styles.fileName}>
                        <IconFile className={styles.fileIcon} />
                        {item.name}
                      </div>
                      <div>{formatBytes(item.size)}</div>
                    </div>
                    <div
                      className={cs(styles.fileDownload, item.progress !== 100 && styles.disable)}
                      onClick={() => item.progress === 100 && onDownloadFile(item.id, item.name)}
                    >
                      <IconToBottom />
                    </div>
                  </div>
                  <Progress color="#fff" trailColor="#aaa" percent={item.progress}></Progress>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.modalFooter}>
        {peerId ? (
          <>
            <Button
              disabled={!enableTransfer}
              type="primary"
              icon={<IconFile />}
              className={styles.sendFile}
              onClick={onSendFile}
            >
              File
            </Button>
            <Input
              value={text}
              onChange={setText}
              disabled={!enableTransfer}
              allowClear
              placeholder="Send Message"
              onPressEnter={onSendText}
            />
            <Button
              onClick={onSendText}
              disabled={!enableTransfer}
              type="primary"
              status="success"
              icon={<IconSend />}
            >
              Send
            </Button>
          </>
        ) : (
          <>
            <Input
              value={toConnectId}
              disabled={state === CONNECTION_STATE.CONNECTING}
              onChange={setToConnectId}
              allowClear
              placeholder="Peer ID"
              onPressEnter={onSendText}
            />
            <Button
              onClick={onConnectPeer}
              disabled={!toConnectId || state === CONNECTION_STATE.CONNECTING}
              type="primary"
              icon={<IconRight />}
            >
              Connect
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};
